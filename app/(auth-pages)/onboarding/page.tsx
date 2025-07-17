import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // If no user, redirect to sign-in
  if (error || !user) {
    redirect('/sign-in')
  }

  // TODO: Check if user has already completed onboarding
  // For now, we'll proceed with the onboarding flow
  
  return (
    <main>
      <OnboardingWizard userEmail={user.email || ''} />
    </main>
  )
} 