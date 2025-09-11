import { Metadata } from "next";
import { ExercisesPage } from "@/components/exercises/exercises-page";

export const metadata: Metadata = {
  title: "Exercise Management",
  description: "Manage exercise library for workout plans",
};

export default function Page() {
  return <ExercisesPage />;
}