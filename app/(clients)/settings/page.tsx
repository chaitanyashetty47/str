import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsContent } from "@/components/settings/settings-content";
import { SettingsHeader, SettingsActions } from "@/components/settings/settings-header";
import { FormMessage, Message } from "@/components/form-message";
import { validateServerRole } from "@/lib/server-role-validation";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Strentor",
  description: "Manage your personal information, preferences, and account settings. Update your profile, change password, and customize your fitness experience.",
  keywords: ["settings", "profile management", "account settings", "user preferences", "personal information"],
};

export default async function SettingsPage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  
  // Validate user authentication and CLIENT role
  const { user } = await validateServerRole(['CLIENT']);
  
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
      {("message" in searchParams || "error" in searchParams) && (
        <FormMessage message={searchParams} />
      )}

      {/* Settings Content */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your personal information, preferences, and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsContent user={user} />
        </CardContent>
      </Card>
    </div>
  );
}