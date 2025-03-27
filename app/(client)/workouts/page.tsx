import Link from "next/link"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAllWorkoutPlanForClient } from "@/actions/clientworkout.action"
import { redirect } from "next/navigation"
import { SearchPlans } from "@/components/workout-plan/search-plans"
import { StatusTabs } from "@/components/workout-plan/status-tabs"

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams object to fix the dynamic API warning
  const params = await searchParams;
  
  // Extract filter parameters from URL
  const query = typeof params.query === 'string' ? params.query : undefined;
  const status = typeof params.status === 'string' 
    ? (params.status === 'active' || params.status === 'previous' 
      ? params.status 
      : undefined) 
    : undefined;

  // Fetch filtered plans
  const { data: workoutPlans, error } = await getAllWorkoutPlanForClient({
    searchQuery: query,
    status: status as 'active' | 'previous' | undefined,
  });

  if (error === "Unauthorized") {
    return redirect("/sign-in?error=Session%20expired");
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Workout Plans</h1>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchPlans defaultValue={query} />
          <StatusTabs defaultValue={status} />
        </div>
      </div>

      {/* Workout Plans Grid */}
      {workoutPlans?.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No workout plans found</h3>
          <p className="text-muted-foreground">
            {query || status
              ? "No plans match your current filters. Try adjusting your search criteria."
              : "You don't have any workout plans yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workoutPlans?.map((plan) => (
            <div key={plan.id} className="border rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {plan.status === "active" ? "Active" : "Previous"}
                  </span>
                </div>
                <p className="text-muted-foreground mb-4">{plan.trainer}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {plan.startDate} - {plan.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{plan.daysPerWeek} days/week</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                    {plan.duration}
                  </div>
                </div>
              </div>

              <div className="border-t p-4 flex justify-end">
                <Button variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50" asChild>
                  <Link href={`/workouts/${plan.id}`}>
                    View Plan <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

