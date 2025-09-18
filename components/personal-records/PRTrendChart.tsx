"use client";

import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PRChartData {
  date: string;
  weight: number;
  reps: number;
  exerciseName: string;
  isPR: boolean;
  exerciseTypeEnum?: "WEIGHT_BASED" | "REPS_BASED"; // Add exercise type
}

interface PRTrendChartProps {
  data: PRChartData[];
  exerciseName: string;
  onPageChange?: (direction: 'prev' | 'next' | 'all') => void;
  currentPage?: number;
  totalPages?: number;
  showPagination?: boolean;
}

export function PRTrendChart({ 
  data, 
  exerciseName, 
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  showPagination = true
}: PRTrendChartProps) {
  // Determine if this is a reps-based exercise
  const isRepsBased = data.length > 0 && data[0].exerciseTypeEnum === "REPS_BASED";
  
  // Group PRs by date and take the best (highest weight/reps) for each date
  const groupedData = [...data]
    .filter((entry) => {
      if (isRepsBased) {
        return typeof entry.reps === "number" && !isNaN(entry.reps);
      } else {
        return typeof entry.weight === "number" && !isNaN(entry.weight);
      }
    })
    .reduce((acc, entry) => {
      const dateKey = entry.date;
      const currentBest = acc[dateKey];
      
      if (!currentBest) {
        acc[dateKey] = entry;
      } else if (isRepsBased) {
        // For reps-based exercises, take the highest reps
        if (entry.reps > currentBest.reps) {
          acc[dateKey] = entry;
        }
      } else {
        // For weight-based exercises, take the highest weight
        if (entry.weight > currentBest.weight) {
          acc[dateKey] = entry;
        }
      }
      return acc;
    }, {} as Record<string, PRChartData>);

  // Prepare chart data: sort by date ascending, take last 10 entries
  const chartData = Object.values(groupedData)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
      reps: entry.reps,
      value: isRepsBased ? entry.reps : entry.weight, // Use reps for reps-based, weight for weight-based
    }));

  const hasEnoughData = data && data.length >= 2;
  let trendText = "";
  let trendValue = 0;
  let isUp = true;

  if (hasEnoughData) {
    // Use the chart data (which is sorted by date) for trend calculation
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    trendValue = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    isUp = trendValue >= 0;
    trendText = `${isUp ? "Trending up" : "Trending down"} by ${Math.abs(trendValue).toFixed(1)}%`;
  }

  // Get unique years for filtering
  const years = Array.from(new Set(data.map(entry => new Date(entry.date).getFullYear())))
    .sort((a, b) => b - a);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{exerciseName}</CardTitle>
            <CardDescription>
              Personal Records Progress
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Year Filter */}
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Start logging workouts to see your progress here!</div>
          </div>
        ) : chartData.length === 1 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <div className="text-lg font-medium mb-2">Need More Data</div>
            <div className="text-sm">Log another PR to see your progress trend</div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {chartData[0].value}{isRepsBased ? '' : ' kg'}
                </div>
                <div className="text-sm text-blue-600">
                  {new Date(chartData[0].date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
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
                  dataKey="value"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{ background: "#fff3e0", border: "1px solid #ffa726" }}
                  labelStyle={{ color: "#ff9800" }}
                  itemStyle={{ color: "#ff9800" }}
                  formatter={(value: any, name: string) => [
                    `${isRepsBased ? 'Reps' : 'ORM'}: ${value}${isRepsBased ? '' : ' kg'}`, 
                    ""
                  ]}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
                  }}
                />
                <Line
                  dataKey="value"
                  type="monotone"
                  stroke="#ff9800"
                  strokeWidth={3}
                  dot={{ fill: "#ff9800", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#ff9800", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-2">
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
          
          {/* Pagination Controls */}
          {showPagination && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.('prev')}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.('next')}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}