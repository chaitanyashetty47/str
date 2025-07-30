export interface TrainerDashboardStats {
  totalClients: number;
  activePlans: number;
  weekProgressPercentage: number; // Overall progress across all clients for current week
}

export interface UpcomingWorkout {
  client: string;
  workoutTitle: string;
  scheduledDate: string; // ISO date string
  exercises: string[]; // Exercise names as bullet points
  status: "pending" | "completed";
}

export interface RecentActivity {
  client: string;
  exerciseName: string;
  weight: number;
  reps: number;
  loggedDate: string; // ISO date string
}

export interface OngoingPlan {
  clientName: string;
  planTitle: string;
  weeklyProgressPercentage: number; // Current week progress
  overallProgressPercentage: number; // Overall plan progress
  currentWeek: number;
  totalWeeks: number;
  planId: string;
}

export interface ClientPR {
  id: string;
  clientName: string;
  exerciseName: string;
  weight: number;
  reps: number | null;
  oneRepMax: number | null;
  date: string; // Formatted date string
}

export interface TrainerDashboardData {
  stats: TrainerDashboardStats;
  upcomingWorkouts: UpcomingWorkout[];
  recentActivity: RecentActivity[];
  ongoingPlans: OngoingPlan[];
  clientPRs: ClientPR[];
}
