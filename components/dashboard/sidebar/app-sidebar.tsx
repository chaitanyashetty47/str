"use client";

// External dependencies
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ChevronDown, Users, Shield } from "lucide-react";
import Image from "next/image";

// Internal components
import { NavMain } from "@/components/dashboard/sidebar/nav-main";
import { NavWorkspace } from "@/components/dashboard/sidebar/nav-workspace";
import { NavSecondary } from "@/components/dashboard/sidebar/nav-secondary";
import { NavUser } from "@/components/dashboard/sidebar/nav-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { sidebarMenus } from "@/data/sidebar-data/sidebar-menus";
import { useAuth } from "@/hooks/useAuth";

/**
 * AppSidebar Component
 *
 * Main application sidebar with navigation sections for the dashboard.
 * Includes app logo/header, main navigation, workspace selection,
 * secondary links, and user profile.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  const { user, isTrainer } = useAuth();
  const pathname = usePathname();

  // Persist sidebar open state in localStorage
  React.useEffect(() => {
    localStorage.setItem("sidebar-open", open.toString());
  }, [open]);

  // Determine current page context for dropdown
  const getCurrentPageTitle = () => {
    if (pathname.startsWith('/training')) return 'Trainer';
    if (pathname.startsWith('/admin')) return 'Admin';
    return 'Strentor';
  };

  const getCurrentIcon = () => {
    // if (pathname.startsWith('/training')) return <Users className="size-4" />;
    // if (pathname.startsWith('/admin')) return <Shield className="size-4" />;
    return (
      <Image
        src="/strentorfav.png"
        alt="Logo"
        width={16}
        height={16}
        className="rounded"
      />
    );
  };

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      {...props}
      aria-label="Main navigation"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isTrainer ? (
              // Dropdown for TRAINER role
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg" 
                    className="hover:bg-accent/50 data-[state=open]:bg-accent"
                    aria-label="Switch between trainer and admin views"
                  >
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      {getCurrentIcon()}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Strentor</span>
                      <span className="truncate text-xs text-sidebar-foreground/70">
                        {getCurrentPageTitle()}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4 shrink-0 opacity-50" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  side="right"
                  className="w-56"
                >
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/training/clients" 
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="size-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Trainer Dashboard</span>
                        <span className="text-xs text-muted-foreground">
                          Manage clients and workouts
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/admin" 
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="size-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Admin Panel</span>
                        <span className="text-xs text-muted-foreground">
                          System administration
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Regular link for other roles
              <SidebarMenuButton size="lg" asChild>
                <Link
                  href={user?.role === 'ADMIN' ? '/admin' : '/home'}
                  className="hover:bg-transparent"
                  aria-label="Go to dashboard home"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image
                      src="/strentorfav.png"
                      alt="Logo"
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Strentor</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarMenus.navMain} />
        {/* <NavWorkspace workspaces={sidebarMenus.workspaces} /> */}
        {/* <NavSecondary items={sidebarMenus.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
