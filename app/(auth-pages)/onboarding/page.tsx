import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding'
import { getProfileDetails } from '@/actions/profile/profile-details.action'

export default async function OnboardingPage() {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser()
  const profileDetails = await getProfileDetails();
  
  // If no user, redirect to sign-in
  if (error || !user) {
    redirect('/sign-in')
  }

  // TODO: Check if user has already completed onboarding
  // For now, we'll proceed with the onboarding flow
  
  return (
    <main>
      <OnboardingWizard userEmail={user.email || ''} userName={profileDetails?.name || ''} />
    </main>
  )
} 