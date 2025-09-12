import { getMaxLiftsData } from "@/actions/client-workout/get-max-lifts.action";
import { PersonalRecordsClient } from "./PersonalRecordsClient";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Records - Strentor",
  description: "Track your personal records and fitness progress over time. View your best lifts, running times, and athletic achievements.",
  keywords: ["personal records", "fitness tracking", "workout progress", "best lifts", "athletic achievements"],
};

export default async function PersonalRecords() {
  // Validate user authentication and CLIENT role
  const { user } = await validateServerRole(['CLIENT']);
  
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