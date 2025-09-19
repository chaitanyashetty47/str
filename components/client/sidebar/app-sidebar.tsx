"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

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
import { NavMain } from "@/components/dashboard/sidebar/nav-main";
import { clientSidebarMenus } from "@/data/sidebar-data/client-sidebar-menus";

/**
 * ClientSidebar Component
 *
 * Sidebar used across client-facing pages. It shares the same UI primitives
 * as the admin/trainer dashboard but renders a different navigation config.
 */
export function ClientSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();

  // Persist sidebar open state in localStorage
  React.useEffect(() => {
    localStorage.setItem("sidebar-open", open.toString());
  }, [open]);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      {...props}
      aria-label="Client main navigation"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/home"
                className="hover:bg-transparent"
                aria-label="Go to home"
              >
                <div
                  className="bg-white text-black flex aspect-square size-8 items-center justify-center rounded-full"
                  aria-hidden="true"
                >
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
                  <span className="truncate text-xs">Client</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={clientSidebarMenus.navMain} />
      </SidebarContent>

      <SidebarFooter>{/* Could add user profile, etc. */}</SidebarFooter>
    </Sidebar>
  );
} 