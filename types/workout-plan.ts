export type WorkoutPlanStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type DateStatus = "CURRENT" | "EXPIRED";

export interface WorkoutPlan {
  id: string;
  title: string;
  client_id: string;
  start_date: Date;
  end_date: Date;
  duration_in_weeks: number;
  category: string;
  description: string | null;
  created_at: Date;
  intensity_mode: string;
  status: WorkoutPlanStatus;
  dateStatus: DateStatus;
  isExpired: boolean;
  isActive: boolean;
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WorkoutPlanFilters {
  status: WorkoutPlanStatus | "all";
  dateStatus: DateStatus | "all";
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export interface WorkoutPlanTableData {
  plans: WorkoutPlan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 