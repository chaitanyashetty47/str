import { redirect } from "next/navigation";
import { DumbbellIcon } from "lucide-react";
import { getTrainerExercises } from "@/actions/exercise.action";
import { AddExerciseButton } from "@/components/exercises/add-exercise-dialog";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { ExerciseSearchForm } from "@/components/exercises/search-form";
import { Pagination } from "@/components/exercises/pagination";

const ITEMS_PER_PAGE = 12;

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams object to fix the dynamic API warning
  const params = await searchParams;
  
  // Extract filter parameters from URL
  const query = typeof params.query === 'string' ? params.query : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  
  // Fetch exercises with filters
  const { data: exercises, error, pagination } = await getTrainerExercises({
    searchQuery: query,
    page: page,
    perPage: ITEMS_PER_PAGE,
  });

  if (error === "Unauthorized") {
    return redirect("/sign-in?error=Session%20expired");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
      {/* Hero section */}
      <div className="relative mb-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold">Exercises</h1>
              <p className="text-muted-foreground mt-2">
                Manage your exercise library for workout plans
              </p>
            </div>
            <AddExerciseButton label="Add New Exercise" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-lg border p-4">
          <ExerciseSearchForm defaultValue={query} />
        </div>
      </div>

      {/* Exercises grid */}
      {exercises?.length === 0 ? (
        <div className="max-w-5xl mx-auto bg-muted/30 rounded-lg p-12 text-center">
          <DumbbellIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No exercises found</h3>
          <p className="text-muted-foreground mb-6">
            {query 
              ? "No exercises match your search. Try different keywords."
              : "Add your first exercise to start building your workout library"
            }
          </p>
          {!query && (
            <AddExerciseButton label="Add Your First Exercise" />
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises?.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
            />
          )}
        </div>
      )}
    </div>
  );
}
