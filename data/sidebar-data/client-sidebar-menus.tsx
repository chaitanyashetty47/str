import {
  LayoutDashboard,
  CreditCard,
  Dumbbell,
  User,
  Camera,
  Calculator,
} from "lucide-react";

/**
 * Navigation configuration for the client-facing sidebar.
 */
export const clientSidebarMenus = {
  navMain: [
    {
      title: "Dashboard",
      url: "/home",
      icon: LayoutDashboard,
    },
    {
      title: "My Subscriptions",
      url: "/subscriptions",
      icon: CreditCard,
    },
    {
      title: "My Workouts",
      url: "/workouts",
      icon: Dumbbell,
    },
    {
      title: "Profile & Settings",
      url: "/profile",
      icon: User,
    },
    {
      title: "Before & After",
      url: "/photos",
      icon: Camera,
    },
    {
      title: "Calculator",
      url: "/calculator",
      icon: Calculator,
    },
  ],
}; 