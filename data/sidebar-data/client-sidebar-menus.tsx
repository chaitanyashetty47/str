import {
 
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,
  Calculator,
  Settings,

  LayoutDashboard, 
  Dumbbell, 
  LineChart, 
  
  

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
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Workout Plans",
      url: "/plans",
      icon: Dumbbell,
      isActive: true,
    },
    {
      title: "Personal Records",
      url: "/personal-records",
      icon: LineChart,
    },
    {
      title: "Calculators",
      url: "/calculator",
      icon: Calculator,
    },
    {
      title: "Settings",
      url: "/settings",
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
