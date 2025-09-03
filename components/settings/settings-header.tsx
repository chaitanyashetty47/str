"use client";

import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";

interface SettingsHeaderProps {
  user: User;
  userProfile?: any;
}

export function SettingsHeader({ user, userProfile }: SettingsHeaderProps) {
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
  );
}

interface SettingsActionsProps {
  hasResetPassword?: boolean;
}

export function SettingsActions({ hasResetPassword = true }: SettingsActionsProps) {
  return (
    <div className="flex gap-2">
      {hasResetPassword && (
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/protected/reset-password'}
        >
          Reset Password
        </Button>
      )}
      <form action={signOutAction}>
        <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90" type="submit">
          Logout
        </Button>
      </form>
    </div>
  );
}