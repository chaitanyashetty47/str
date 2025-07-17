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

export function BMIAreaChart({ data }: { data: { date: string, bmi: number }[] }) {
  // Prepare chart data: last 6 entries, sorted by date ascending
  const chartData = [...data]
    .filter((entry) => typeof entry.bmi === "number" && !isNaN(entry.bmi))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6)
    .map((entry) => ({
      date: entry.date,
      bmi: entry.bmi,
    }));

  const hasEnoughData = data && data.length >= 2;
  let trendText = "";
  let trendValue = 0;
  let isUp = true;

  if (hasEnoughData) {
    const last = data[0].bmi;
    const first = data[data.length - 1].bmi;
    trendValue = first !== 0 ? ((last - first) / first) * 100 : 0;
    isUp = trendValue >= 0;
    trendText = `${isUp ? "Trending up" : "Trending down"} by ${Math.abs(trendValue).toFixed(1)}%`;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>BMI Trend</CardTitle>
        <CardDescription>
          Showing BMI for the last {chartData.length} entries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
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
                dataKey="bmi"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                domain={["auto", "auto"]}
                tickFormatter={(value) => value}
              />
              <Tooltip
                contentStyle={{ background: "#fff3e0", border: "1px solid #ffa726" }}
                labelStyle={{ color: "#ff9800" }}
                itemStyle={{ color: "#ff9800" }}
                formatter={(value: any) => [`BMI: ${value}`, ""]}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                }}
              />
              <Area
                dataKey="bmi"
                type="natural"
                fill="#ff9800"
                fillOpacity={0.4}
                stroke="#ff9800"
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
