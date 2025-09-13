"use client";

// External dependencies
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

// Internal components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

/**
 * NavUser Component
 *
 * Shows the currently authenticated user's info inside the sidebar footer.
 * We pull user data from the global `AuthContext` which is already provided
 * at the application root (see `components/providers/Providers.tsx`). This
 * avoids making an extra Supabase request in this component and keeps all
 * auth-related state in one place.
 */
export function NavUser() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const { user, signOut, loading } = useAuth();
  

  // While loading, render nothing – the sidebar skeleton already provides
  // a placeholder for this area. Alternatively we could show a spinner.
  if (loading) return null;

  // Fallbacks in case some fields are missing (e.g. during onboarding)
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "User";
  const displayEmail = user?.email ?? "";
  const avatarSrc = "/avatars/avatar.png"; // TODO: replace with real avatar url when available

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };
  const handleBillingClick = async() => {
    router.push("/settings/subscription");
  }
  const handleAccountClick = async() => {
    if (!user?.role) return;
    
    // Role-based navigation logic
    switch (user.role) {
      case 'CLIENT':
        router.push("/settings");
        break;
      case 'FITNESS_TRAINER':
        router.push("/fitness/settings");
        break;
      case 'PSYCHOLOGY_TRAINER':
        router.push("/psychological/settings");
        break;
      case 'MANIFESTATION_TRAINER':
        router.push("/manifestation/settings");
        break;
      case 'ADMIN':
        router.push("/admin/settings");
        break;
      case 'FITNESS_TRAINER_ADMIN':
        // Route based on current path
        if (pathname.startsWith('/fitness')) {
          router.push("/fitness/settings");
        } else if (pathname.startsWith('/admin')) {
          router.push("/admin/settings");
        } else {
          // Default to fitness settings if not on specific route
          router.push("/fitness/settings");
        }
        break;
      default:
        // Fallback to client settings
        router.push("/settings");
    }
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer hover:bg-transparent hover:font-bold hover:underline hover:underline-offset-4"
              aria-label="User profile and options"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarSrc} alt={`${displayName}'s profile`} />
                <AvatarFallback className="rounded-lg">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            role="menu"
            aria-label="User options"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={avatarSrc}
                    alt={`${displayName}'s profile`}
                  />
                  <AvatarFallback className="rounded-lg">
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleAccountClick} role="menuitem">
                <BadgeCheck aria-hidden="true" />
                Account
              </DropdownMenuItem>
              {/* Only show billing for CLIENT users */}
              {user?.role === 'CLIENT' && (
                <DropdownMenuItem onClick={handleBillingClick} role="menuitem">
                  <CreditCard aria-hidden="true" />
                  Billing
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} role="menuitem">
              <LogOut aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
