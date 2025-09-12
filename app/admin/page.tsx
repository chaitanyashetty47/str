import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { getAdminDashboardData } from "@/actions/admin/admin.dashboard.action";
import { RecentSalesCard } from "@/components/admin/recent-sales-card";
import { UserSignupsChart } from "@/components/admin/user-signups-chart";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Strentor",
  description: "Comprehensive admin dashboard for managing users, trainers, subscriptions, and platform analytics. Monitor growth metrics and system performance.",
  keywords: ["admin dashboard", "user management", "trainer management", "subscription analytics", "platform metrics", "admin tools"],
};

export default async function AdminPage() {
  // Validate user authentication and ADMIN/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['ADMIN', 'FITNESS_TRAINER_ADMIN']);

  // Fetch dashboard data
  let dashboardData;
  try {
    dashboardData = await getAdminDashboardData();
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    // Return a fallback UI or redirect
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">Unable to load admin dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Create stats array from the dashboard data
  const stats = [
    {
      title: "Total Users",
      value: dashboardData.stats.totalUsers.toLocaleString(),
      icon: Users,
      change: `${dashboardData.stats.usersChange >= 0 ? '+' : ''}${dashboardData.stats.usersChange} from last month`,
      changeType: dashboardData.stats.usersChange >= 0 ? "positive" : "negative",
    },
    {
      title: "Subscribed Clients",
      value: dashboardData.stats.subscribedClients.toLocaleString(),
      icon: CreditCard,
      change: `${dashboardData.stats.subscribedClientsChange >= 0 ? '+' : ''}${dashboardData.stats.subscribedClientsChange} from last month`,
      changeType: dashboardData.stats.subscribedClientsChange >= 0 ? "positive" : "negative",
    },
    {
      title: "Total Revenue",
      value: `₹${dashboardData.stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: `${dashboardData.stats.revenueGrowthPercentage >= 0 ? '+' : ''}${dashboardData.stats.revenueGrowthPercentage}% from last month`,
      changeType: dashboardData.stats.revenueGrowthPercentage >= 0 ? "positive" : "negative",
    },
  ];

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                {stat.changeType === "positive" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : stat.changeType === "negative" ? (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                ) : null}
                <p
                  className={`text-sm ${
                    stat.changeType === "positive"
                      ? "text-green-500"
                      : stat.changeType === "negative"
                      ? "text-red-500"
                      : "text-blue-500"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section - User Signups and Recent Sales side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserSignupsChart userSignupsData={dashboardData.userSignupsData} />
        <RecentSalesCard recentSubscriptions={dashboardData.recentSubscriptions} />
      </div>

      {/* Additional admin-specific content can be added here */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold">System Overview</h3>
              <span className="text-sm text-muted-foreground ml-auto">Platform metrics</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                <Badge variant="outline" className="ml-auto">{dashboardData.stats.subscribedClients}</Badge>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <Badge variant="outline" className="ml-auto">{dashboardData.stats.totalUsers}</Badge>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <Badge variant="outline" className="ml-auto">₹{dashboardData.stats.totalRevenue.toLocaleString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold">Growth Metrics</h3>
              <span className="text-sm text-muted-foreground ml-auto">Month over month</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">User Growth</span>
                <div className="flex items-center gap-2 ml-auto">
                  {dashboardData.stats.usersChange >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    dashboardData.stats.usersChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {dashboardData.stats.usersChange >= 0 ? '+' : ''}{dashboardData.stats.usersChange}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Revenue Growth</span>
                <div className="flex items-center gap-2 ml-auto">
                  {dashboardData.stats.revenueGrowthPercentage >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    dashboardData.stats.revenueGrowthPercentage >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {dashboardData.stats.revenueGrowthPercentage >= 0 ? '+' : ''}{dashboardData.stats.revenueGrowthPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}