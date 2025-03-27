"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

// Mock data for the workout volume chart
const volumeData = [
  { date: "Jan 1", volume: 5000 },
  { date: "Jan 8", volume: 5500 },
  { date: "Jan 15", volume: 6000 },
  { date: "Jan 22", volume: 6200 },
  { date: "Jan 29", volume: 6500 },
  { date: "Feb 5", volume: 7000 },
  { date: "Feb 12", volume: 7200 },
]

export default function ProgressGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Overview</CardTitle>
        <CardDescription>Track your fitness journey over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weight">
          <TabsList className="mb-4">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="volume">Workout Volume</TabsTrigger>
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
          <TabsContent value="volume" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

