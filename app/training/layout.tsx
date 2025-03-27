"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  LineChart, 
  FileText,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { TrainingBreadcrumb } from "@/components/training-breadcrumb";
import React from "react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/training",
    color: "text-sky-500",
  },
  {
    label: "My Clients",
    icon: Users,
    href: "/training/clients",
    color: "text-violet-500",
  },
  {
    label: "Workout Plans",
    icon: Dumbbell,
    href: "/training/plans",
    color: "text-pink-700",
  },
  {
    label: "Client Progress",
    icon: LineChart,
    href: "/training/progress",
    color: "text-orange-700",
  },
  {
    label: "Reports & Feedback",
    icon: FileText,
    href: "/training/reports",
    color: "text-emerald-500",
  },
  {
    label: "Exercises",
    icon: FileText,
    href: "/training/exercises",
    color: "text-red-500",
  },
  
];

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if we're on a specific page that manages its own breadcrumb
  // This is determined by the pathname pattern rather than component metadata
  const shouldRenderDefaultBreadcrumb = (() => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Don't render default breadcrumb on plan detail pages (they render their own)
    if (segments.includes('plans') && segments.length > 2) {
      return false;
    }
    
    // Don't render default breadcrumb on day detail pages
    if (segments.includes('days') && segments.length > 3) {
      return false;
    }
    
    // Don't render default breadcrumb on exercise detail pages
    if (segments.includes('exercises') && segments.length > 4) {
      return false;
    }
    
    return true;
  })();

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-72 h-full bg-gray-900 fixed left-0 top-0 bottom-0 z-30">
        <div className="flex flex-col h-full text-white">
          <div className="px-3 py-6">
            <Link href="/training" className="flex items-center pl-3 mb-10">
              <h1 className="text-2xl font-bold">TRAINER</h1>
            </Link>
            <div className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                    pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                    {route.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 z-30 w-full bg-white border-b p-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-gray-900">
          <SheetTitle className="hidden">Menu</SheetTitle> 
            <div className="space-y-4 py-4 flex flex-col h-full text-white">
              <div className="px-3 py-2 flex-1">
                <Link href="/training" className="flex items-center pl-3 mb-14">
                  <h1 className="text-2xl font-bold">TRAINER</h1>
                </Link>
                <div className="space-y-1">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                        "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                        pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                        {route.label}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-40 w-full">
        <div className="flex flex-col h-full">
          {/* Breadcrumb at the top */}
          <div className="px-6 pt-6 md:px-8 md:pt-5">
            {shouldRenderDefaultBreadcrumb && <TrainingBreadcrumb />}
          </div>
          
          {/* Content area */}
          <div className="flex-1 px-6 pb-6 md:px- md:pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 