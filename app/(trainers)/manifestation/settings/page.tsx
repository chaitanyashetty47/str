import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManifestationTrainerProfileForm } from "@/components/profile/manifestation-trainer-profile-form";
import { SettingsHeader, SettingsActions } from "@/components/settings/settings-header";
import { FormMessage, Message } from "@/components/form-message";

export default async function SettingsPage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Get user data
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirect("/sign-in?error=Session%20expired");
  }

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
            Manage your manifestation trainer profile and account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManifestationTrainerProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
