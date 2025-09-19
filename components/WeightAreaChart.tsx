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

export function WeightAreaChart({ data }: { data: { date: string, weight: number }[] }) {
  // Prepare chart data: last 6 entries, sorted by date ascending
  const chartData = [...data]
    .filter((entry) => typeof entry.weight === "number" && !isNaN(entry.weight))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6)
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
    }));

  const hasEnoughData = data && data.length >= 2;
  let trendText = "";
  let trendValue = 0;
  let isUp = true;

  if (hasEnoughData) {
    const last = data[data.length - 1].weight;
    const first = data[0].weight;
    trendValue = first !== 0 ? ((last - first) / first) * 100 : 0;
    isUp = trendValue >= 0;
    trendText = `${isUp ? "Trending up" : "Trending down"} by ${Math.abs(trendValue).toFixed(1)}%`;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Weight Progress</CardTitle>
        <CardDescription>
          {chartData.length > 0 
            ? `Showing weight for the last ${chartData.length} entries`
            : "No weight data available"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ left: 50, right: 12, top: 12, bottom: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                }}
              />
              <YAxis
                dataKey="weight"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={50}
                domain={["auto", "auto"]}
                tickFormatter={(value) => value}
              />
              <Tooltip
                contentStyle={{ 
                  background: "rgba(255, 189, 34, 0.6)", 
                  border: "1px solid rgba(255, 189, 34, 0.9)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(255, 189, 34, 0.3)",
                  backdropFilter: "blur(8px)"
                }}
                labelStyle={{ 
                  color: "#1a1a1a", 
                  fontWeight: "600",
                  fontSize: "12px"
                }}
                itemStyle={{ 
                  color: "#1a1a1a", 
                  fontWeight: "500",
                  fontSize: "11px"
                }}
                formatter={(value: any) => [`${value} kg`, "Weight"]}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                }}
              />
              <Area
                dataKey="weight"
                type="natural"
                fill="rgba(255, 189, 34, 0.2)"
                fillOpacity={0.3}
                stroke="rgba(255, 189, 34, 0.8)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {hasEnoughData ? (
                <>
                  {trendText} {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </>
              ) : chartData.length === 1 ? (
                "Single data point - more entries needed for trend analysis"
              ) : (
                "Not enough data to show trend"
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {chartData.length > 0 && (() => {
                const first = new Date(chartData[0].date);
                const last = new Date(chartData[chartData.length - 1].date);
                return `${first.getDate()} ${first.toLocaleString("default", { month: "short" })} - ${last.getDate()} ${last.toLocaleString("default", { month: "short" })} ${last.getFullYear()}`;
              })()}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 