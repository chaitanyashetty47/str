"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for the weight progress chart
const weightData = [
  { date: "Jan 1", weight: 185 },
  { date: "Jan 8", weight: 183 },
  { date: "Jan 15", weight: 181 },
  { date: "Jan 22", weight: 180 },
  { date: "Jan 29", weight: 178 },
  { date: "Feb 5", weight: 177 },
  { date: "Feb 12", weight: 176 },
]

// Mock data for the body fat percentage chart
const bodyFatData = [
  { date: "Jan 1", percentage: 22 },
  { date: "Jan 8", percentage: 21.5 },
  { date: "Jan 15", percentage: 21 },
  { date: "Jan 22", percentage: 20.5 },
  { date: "Jan 29", percentage: 20 },
  { date: "Feb 5", percentage: 19.5 },
  { date: "Feb 12", percentage: 19 },
]

export default function ProgressGraphs() {
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Progress Overview</h2>
      <p className="text-muted-foreground mb-6">Track your fitness journey over time</p>

      <Tabs defaultValue="weight">
        <TabsList className="mb-6">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="bodyfat">Body Fat Percentage</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="bodyfat" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bodyFatData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="percentage" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}

