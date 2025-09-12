import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PsychologyTrainerProfileForm } from "@/components/profile/psychology-trainer-profile-form";
import { SettingsHeader, SettingsActions } from "@/components/settings/settings-header";
import { FormMessage, Message } from "@/components/form-message";
import { createClient } from "@/utils/supabase/server";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Psychology Trainer Settings - Strentor",
  description: "Manage your psychology trainer profile, update credentials, and customize your professional settings. Comprehensive profile management for psychology trainers.",
  keywords: ["psychology trainer settings", "profile management", "trainer credentials", "professional settings", "psychology trainer profile", "trainer tools"],
};

export default async function SettingsPage(props: {
  searchParams: Promise<Message>;
}) {
  // Validate user authentication and PSYCHOLOGY_TRAINER role
  const { user } = await validateServerRole(['PSYCHOLOGY_TRAINER']);
  
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile:", profileError);
  }



  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SettingsHeader user={user} userProfile={profile} />
        <SettingsActions />
      </div>
      
      {/* Display success/error messages only when there are search params */}
      {("message" in searchParams || "error" in searchParams || "success" in searchParams) && (
        <FormMessage message={searchParams} />
      )}

      {/* Settings Content */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your psychology trainer profile and account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PsychologyTrainerProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}