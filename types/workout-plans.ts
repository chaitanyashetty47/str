import { WorkoutCategory } from "@prisma/client";

export type WorkoutPlan = {
    id?: string;
    title: string;
    description: string;
    startDate: Date;
    durationWeeks: number;
    endDate: Date;
    clientId: string;
    category: WorkoutCategory;
}
