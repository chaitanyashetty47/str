import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/utils/prisma/prismaClient'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        try {
          // Check if user has completed onboarding
          const userProfile = await prisma.users_profile.findUnique({
            where: { id: user.id },
            select: {
              profile_completed: true,
              onboarding_completed: true
            }
          })

          // If user hasn't completed onboarding, redirect to onboarding
          if (!userProfile?.profile_completed || !userProfile?.onboarding_completed) {
            redirect('/onboarding')
          } else {
            // User has completed onboarding, redirect to dashboard
            redirect('/dashboard')
          }
        } catch (dbError) {
          console.error('Database error checking onboarding status:', dbError)
          // If there's a DB error, redirect to onboarding as fallback
          redirect('/onboarding')
        }
      } else {
        // No user found, redirect to onboarding
        redirect('/onboarding')
      }
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error')
}