import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOutAction } from "@/app/actions";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsSubscriptionPage() {
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

  // Get user's initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : user.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
            <AvatarFallback>{getInitials(user.user_metadata?.full_name || "")}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user.user_metadata?.full_name || user.email}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <form action={signOutAction}>
            <Button variant="outline" type="submit">Logout</Button>
          </form>
        </div>
      </div>

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