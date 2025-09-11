import {
  SquareTerminal,
  Users,
  FileText,
  BarChart,
  Settings2,
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,
  Calculator,
  Settings,
  HandCoins,
  ShoppingCart,

  LayoutDashboard, 
  Dumbbell, 
  LineChart, 
  Menu
  

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
      url: "/manifestation",
      icon: LayoutDashboard,
      isActive: true,

    },

    {
      title: "My Clients",
      url: "/manifestation/clients",
      icon: Users,
      isActive: true,

    },
   


    {
      title: "Settings",
      url: "/manifestation/settings",
      icon: Settings,
    },

    // {
    //   title: "Invoices",
    //   url: "/dashboard/invoices",
    //   icon: FileText,
    //   items: [
    //     {
    //       title: "All Invoices",
    //       url: "/dashboard/invoices",
    //     },
    //     {
    //       title: "Pending",
    //       url: "/dashboard/invoices/pending",
    //     },
    //     {
    //       title: "Paid",
    //       url: "/dashboard/invoices/paid",
    //     },
    //   ],
    // },
    // {
    //   title: "Reports",
    //   url: "/dashboard/reports/sales",
    //   icon: BarChart,
    //   items: [
    //     {
    //       title: "Sales Report",
    //       url: "/dashboard/reports/sales",
    //     },
    //     {
    //       title: "Customer Insights",
    //       url: "/dashboard/reports/customer-insights",
    //     },
    //     {
    //       title: "Revenue",
    //       url: "/dashboard/reports/revenue",
    //     },
    //   ],
    // },
    // {
    //   title: "Settings",
    //   url: "/dashboard/settings/general",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "General",
    //       url: "/dashboard/settings/general",
    //     },
    //     {
    //       title: "Users & Permissions",
    //       url: "/dashboard/settings/users",
    //     },
    //     {
    //       title: "Integrations",
    //       url: "/dashboard/settings/integrations",
    //     },
    //     {
    //       title: "API Settings",
    //       url: "/dashboard/settings/api",
    //     },
    //   ],
    // },
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
