"use client";

import * as React from "react";
import { useIsClient } from "@uidotdev/usehooks";

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/client/sidebar/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Separator } from "@/components/ui/separator";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/**
 * ClientDashboardLayoutWrapper Component
 *
 * Provides the same structural layout (sidebar, header, content area) for
 * client-facing pages as the admin dashboard uses.
 */
export default function ClientDashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isClient = useIsClient();

  const isOpen = isClient
    ? localStorage.getItem("sidebar-open")
      ? localStorage.getItem("sidebar-open") === "true"
      : true
    : true;

  // During SSR / first paint show skeleton to avoid hydration mismatch
  if (!isClient) return <DashboardSkeleton />;

  return (
    <SidebarProvider defaultOpen={isOpen}>
      <ClientSidebar id="client-sidebar" />
      <SidebarInset
        className="flex flex-col md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0"
        role="main"
      >
        <DashboardHeader />
        <Separator className="bg-secondary" aria-hidden="true" />
        <div className="flex-1 overflow-auto p-4" aria-label="Page content">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 