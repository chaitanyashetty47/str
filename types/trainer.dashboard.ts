export type WorkoutType = string;

export interface TrainerDashboardStats {
  totalClients: number;
  activePlans: number;
  completedSessions: number;
}

export interface UpcomingSession {
  client: string;
  sessionType: WorkoutType;
  status: string;
}

export interface RecentUpdate {
  client: string;
  action: string;
  time: string;
  weekNumber: number;
  day: number;
  workoutType: WorkoutType;
}

export interface TrainerDashboardData {
  stats: TrainerDashboardStats;
  upcomingSessions: UpcomingSession[];
  recentUpdates: RecentUpdate[];
}
