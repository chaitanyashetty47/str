import {
  Users,
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,
  Settings,
  LayoutDashboard, 
 
  

} from "lucide-react";

export const clientSidebarMenus = {
  user: {
    name: "James",
    email: "james@example.com",
    avatar: "/avatars/avatar.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/psychological",
      icon: LayoutDashboard,
      isActive: true,

    },

    {
      title: "My Clients",
      url: "/psychological/clients",
      icon: Users,
      isActive: true,

    },
   


    {
      title: "Settings",
      url: "/psychological/settings",
      icon: Settings,
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
