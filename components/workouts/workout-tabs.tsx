"use client"

import { useState } from "react"
import { ClipboardList, LineChart } from "lucide-react"

export default function WorkoutTabs() {
  const [activeTab, setActiveTab] = useState<"routine" | "tracking">("routine")

  return (
    <div className="mb-6">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("routine")}
          className={`flex items-center px-4 py-2 border-b-2 ${
            activeTab === "routine"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Workout Routine
        </button>
        <button
          onClick={() => setActiveTab("tracking")}
          className={`flex items-center px-4 py-2 border-b-2 ${
            activeTab === "tracking"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LineChart className="h-4 w-4 mr-2" />
          Progress Tracking
        </button>
      </div>
    </div>
  )
}

