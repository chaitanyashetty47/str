import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, User } from "lucide-react";
import { getManifestationTrainerDashboardData } from "@/actions/manifestation-trainer.dashboard.action";
import Link from "next/link";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifestation Trainer Dashboard - Strentor",
  description: "Manage your manifestation clients, track goal progress, and provide comprehensive manifestation coaching. Professional manifestation trainer dashboard.",
  keywords: ["manifestation trainer", "manifestation coaching", "goal setting", "manifestation dashboard", "client management", "trainer tools"],
};

export default async function ManifestationDashboard() {
  // Validate user authentication and MANIFESTATION_TRAINER role
  const { user } = await validateServerRole(['MANIFESTATION_TRAINER']);

  // Fetch data using the server action
  const dashboardData = await getManifestationTrainerDashboardData();

  // Create stats array from the dashboard data
  const stats = [
    {
      title: "Total Clients",
      value: dashboardData.stats.totalClients.toString(),
      icon: Users,
      change: "manifestation clients",
      changeType: "neutral",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Manifestation Trainer Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm mt-2 text-blue-500">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Clients Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Recent Clients</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Latest assignments</span>
              <Link 
                href="/manifestation/clients"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all clients →
              </Link>
            </div>
          </div>

          {dashboardData.recentClients && dashboardData.recentClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Client
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-700">
                      Assigned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentClients.map((client, index) => (
                    <tr
                      key={client.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{client.clientName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {client.clientEmail}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {client.category || "MANIFESTATION"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-gray-500">
                          <div className="text-sm">
                            {new Date(client.assignedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {client.daysSinceAssignment} days ago
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-gray-50/50 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium text-gray-600">
                No clients assigned yet.
              </p>
              <p className="text-sm mt-2 text-gray-500">
                You haven't been assigned any manifestation clients yet!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
