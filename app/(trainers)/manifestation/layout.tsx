import DashboardLayoutWrapper from "@/components/dashboard/dashboard-layout-manifestation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
