"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { type UserSignupData } from "@/actions/admin/admin.dashboard.action";

interface UserSignupsChartProps {
  userSignupsData: UserSignupData[];
}

export function UserSignupsChart({ userSignupsData }: UserSignupsChartProps) {
  // Calculate total signups for current year
  const totalSignups = userSignupsData?.reduce((sum, item) => sum + item.signups, 0) || 0;
  
  // Handle empty data
  if (!userSignupsData || userSignupsData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Signups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">No data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Signups
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {new Date().getFullYear()} - Monthly user registrations
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userSignupsData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="month" 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-2 shadow-lg">
                      <p className="font-medium">{payload[0].payload.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].value} signups
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="signups" 
              fill="var(--chart-1)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Total Signups:</span>
            <span className="text-2xl font-bold">{totalSignups}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>This Year</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
