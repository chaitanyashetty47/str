"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for the charts
const weightData = [
  { week: "Week 1", squat: 135, bench: 95, deadlift: 185 },
  { week: "Week 2", squat: 145, bench: 105, deadlift: 195 },
  { week: "Week 3", squat: 155, bench: 115, deadlift: 205 },
  { week: "Week 4", squat: 165, bench: 125, deadlift: 225 },
  { week: "Week 5", squat: 175, bench: 135, deadlift: 245 },
  { week: "Week 6", squat: 185, bench: 145, deadlift: 265 },
]

const volumeData = [
  { week: "Week 1", volume: 5400 },
  { week: "Week 2", volume: 6200 },
  { week: "Week 3", volume: 7000 },
  { week: "Week 4", volume: 7500 },
  { week: "Week 5", volume: 8200 },
  { week: "Week 6", volume: 9000 },
]

export default function ProgressCharts() {
  return (
    <div className="mt-6">
      <Tabs defaultValue="weight">
        <TabsList className="mb-4">
          <TabsTrigger value="weight">Weight Progress</TabsTrigger>
          <TabsTrigger value="volume">Volume Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="h-[400px]">
          <ChartContainer
            config={{
              squat: {
                label: "Squat",
                color: "hsl(var(--chart-1))",
              },
              bench: {
                label: "Bench Press",
                color: "hsl(var(--chart-2))",
              },
              deadlift: {
                label: "Deadlift",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-full"
          >
            <LineChart data={weightData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis label={{ value: "Weight (lbs)", angle: -90, position: "insideLeft" }} />
              <Line type="monotone" dataKey="squat" stroke="var(--color-squat)" strokeWidth={2} />
              <Line type="monotone" dataKey="bench" stroke="var(--color-bench)" strokeWidth={2} />
              <Line type="monotone" dataKey="deadlift" stroke="var(--color-deadlift)" strokeWidth={2} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="volume" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis label={{ value: "Volume (lbs)", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Bar dataKey="volume" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}

