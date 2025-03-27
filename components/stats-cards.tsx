import { Calendar, Activity, BarChart3 } from "lucide-react"

interface StatsCardsProps {
  programLength: number
  workoutsPerWeek: number
  completionRate: number
}

export default function StatsCards({ programLength, workoutsPerWeek, completionRate }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
      <div className="bg-purple-50 rounded-lg p-6 flex items-center">
        <div className="bg-white p-3 rounded-lg mr-4">
          <Calendar className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-purple-700 mb-1">Program Length</h3>
          <p className="text-2xl font-bold text-purple-900">{programLength} Weeks</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 flex items-center">
        <div className="bg-white p-3 rounded-lg mr-4">
          <Activity className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-blue-700 mb-1">Workouts/Week</h3>
          <p className="text-2xl font-bold text-blue-900">{workoutsPerWeek} days</p>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-6 flex items-center">
        <div className="bg-white p-3 rounded-lg mr-4">
          <BarChart3 className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-green-700 mb-1">Completion Rate</h3>
          <p className="text-2xl font-bold text-green-900">{completionRate}%</p>
        </div>
      </div>
    </div>
  )
}

