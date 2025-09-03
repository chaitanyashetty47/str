

import { Suspense } from 'react';
import { TransformationTabs } from '@/components/transformation/transformation-tabs';
import { Camera } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

async function TransformationPageContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirect("/sign-in?error=Session%20expired");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Transformation Photos</h1>
          <p className="text-muted-foreground">
            Track your fitness journey with before and after photos
          </p>
        </div>
      </div>

      <TransformationTabs userId={user.id} />
    </div>
  );
}

export default function TransformationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transformation photos...</p>
        </div>
      </div>
    }>
      <TransformationPageContent />
    </Suspense>
  );
}