'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/utils/prisma/prismaClient'
import { onboardingSchema } from '@/types/onboarding'



export async function completeOnboardingAction(data: unknown) {
  // Validate data
  const result = onboardingSchema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      error: 'Invalid form data',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }

  // Get authenticated user
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'Authentication required'
    }
  }

  try {
    // Prepare measurement data (convert empty strings to null)
    const prepareMeasurement = (value: number | string | undefined) => {
      if (value === '' || value === undefined) return null
      return typeof value === 'string' ? parseFloat(value) : value
    }

    // Update user profile in database (role defaults to CLIENT)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: result.data.name,
        weight: result.data.weight,
        weightUnit: result.data.weightUnit,
        height: result.data.height,
        heightUnit: result.data.heightUnit,
        dateOfBirth: new Date(result.data.dateOfBirth),
        gender: result.data.gender,
        activityLevel: result.data.activityLevel,
        // Optional measurements
        neck: prepareMeasurement(result.data.neck),
        waist: prepareMeasurement(result.data.waist),
        hips: prepareMeasurement(result.data.hips),
        profileCompleted: true,
        onboardingCompleted: new Date()
      }
    })

    // Create initial weight log entry
    await prisma.weightLog.create({
      data: {
        userId: user.id,
        weight: result.data.weight,
        weightUnit: result.data.weightUnit,
        dateLogged: new Date(),
        notes: 'Initial weight from onboarding'
      }
    })

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
    return {
      success: false,
      error: 'Failed to save profile. Please try again.'
    }
  }
}

export async function getUserOnboardingStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileCompleted: true,
        onboardingStarted: true,
        onboardingCompleted: true,
        name: true,
        weight: true,
        height: true,
        neck: true,
        waist: true,
        hips: true
      }
    })

    return { success: true, user }
  } catch (error) {
    console.error('Failed to get onboarding status:', error)
    return { success: false, error: 'Failed to check onboarding status' }
  }
}
