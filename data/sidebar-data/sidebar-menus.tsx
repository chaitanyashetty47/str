import {

  Users,

  Settings,
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,


  LayoutDashboard, 
  Dumbbell, 

  

} from "lucide-react";

export const sidebarMenus = {
  user: {
    name: "James",
    email: "james@example.com",
    avatar: "/avatars/avatar.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/fitness",
      icon: LayoutDashboard,
      isActive: true,

    },
    {
      title: "My Clients",
      url: "/fitness/clients",
      icon: Users,

    },
    {
      title: "Workout Plans",
      url: "/fitness/plans",
      icon: Dumbbell,
      items: [
        {
          title: "All Plans",
          url: "/fitness/plans/all",
        },
        {
          title: "Create Plan",
          url: "/fitness/plans/create",
        },

      ],
    },
    {
      title: "Settings",
      url: "/fitness/settings",
      icon: Settings,
      isActive: true,

    },

  ],
  navSecondary: [
    {
      title: "Support",
      url: "/dashboard/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/dashboard/feedback",
      icon: Send,
    },
  ],
  workspaces: [
    {
      name: "Customer Management",
      url: "/dashboard/customers",
      icon: Frame,
    },
    {
      name: "Sales Performance",
      url: "/dashboard/reports/sales",
      icon: PieChart,
    },
    {
      name: "Business Expansion",
      url: "/dashboard/reports/sales",
      icon: Map,
    },
  ],
};
