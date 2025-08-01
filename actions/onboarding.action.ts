'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/utils/prisma/prismaClient'
import { onboardingSchema } from '@/types/onboarding'
import { v4 as uuidv4 } from 'uuid'


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
    const updatedUser = await prisma.users_profile.update({
      where: { id: user.id },
      data: {
        name: result.data.name,
        weight: result.data.weight,
        weight_unit: result.data.weightUnit,
        height: result.data.height,
        height_unit: result.data.heightUnit,
        date_of_birth: new Date(result.data.dateOfBirth),
        gender: result.data.gender,
        activity_level: result.data.activityLevel,
        // Optional measurements
        neck: prepareMeasurement(result.data.neck),
        waist: prepareMeasurement(result.data.waist),
        hips: prepareMeasurement(result.data.hips),
        profile_completed: true,
        onboarding_completed: new Date()
      }
    })

    // Create initial weight log entry
    await prisma.weight_logs.create({
      data: {
        id: uuidv4(),
        user_id: user.id,
        weight: result.data.weight,
        weight_unit: result.data.weightUnit,
        date_logged: new Date(),
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
    const user = await prisma.users_profile.findUnique({
      where: { id: userId },
      select: {
        profile_completed: true,
        onboarding_started: true,
        onboarding_completed: true,
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
