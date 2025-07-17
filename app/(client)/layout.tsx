import ClientDashboardLayoutWrapper from "@/components/client/dashboard-layout";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientDashboardLayoutWrapper>{children}</ClientDashboardLayoutWrapper>;
} 