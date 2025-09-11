"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BodyFatAreaChart({ data }: { data: { date: string, bodyFatPercentage: number }[] }) {
  // Prepare chart data: last 6 entries, sorted by date ascending
  const chartData = [...data]
    .filter((entry) => typeof entry.bodyFatPercentage === "number" && !isNaN(entry.bodyFatPercentage))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6)
    .map((entry) => ({
      date: entry.date,
      bodyFatPercentage: entry.bodyFatPercentage,
    }));

  // Calculate trend
  const trend = chartData.length >= 2 
    ? chartData[chartData.length - 1].bodyFatPercentage - chartData[chartData.length - 2].bodyFatPercentage
    : 0;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-blue-600">
            Body Fat: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Body Fat Progress</CardTitle>
          <CardDescription>Track your body fat percentage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Body Fat Progress</CardTitle>
          <CardDescription>Track your body fat percentage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {chartData[0].bodyFatPercentage}%
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(chartData[0].date)}
              </div>
              <p className="text-xs text-gray-400 mt-2">Add more entries to see trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">Body Fat Progress</CardTitle>
            <CardDescription>Track your body fat percentage over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : null}
            <span className={`text-sm font-medium ${trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-500'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={['dataMin - 2', 'dataMax + 2']}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="bodyFatPercentage"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#bodyFatGradient)"
              fillOpacity={0.3}
            />
            <defs>
              <linearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Last updated: {formatDate(chartData[chartData.length - 1].date)}
      </CardFooter>
    </Card>
  );
} 