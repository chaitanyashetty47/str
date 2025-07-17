import { getMaxLiftsData } from "@/actions/client-workout/get-max-lifts.action";
import { PersonalRecordsClient } from "./PersonalRecordsClient";

export default async function PersonalRecords() {
  const { uniqueExercises, allMaxLifts } = await getMaxLiftsData();
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Personal Records</h1>
        <p className="text-gray-600 mt-2">
          Track your personal records and progress over time
        </p>
      </div>
      
      <PersonalRecordsClient 
        uniqueExercises={uniqueExercises}
        allMaxLifts={allMaxLifts}
      />
    </div>
  );
}