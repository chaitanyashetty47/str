export type TrainerCategory = "FITNESS" | "PSYCHOLOGY" | "MANIFESTATION";

export interface TrainerClientAssignment {
  id: string;
  category: string | null;
  clientId: string;
  clientName: string;
}

export interface AdminTrainer {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  category: TrainerCategory | "UNKNOWN";
  clientCount: number;
  clientAssignments: TrainerClientAssignment[];
}

export interface AdminTrainerFilters {
  search: string;
  category: "ALL" | TrainerCategory;
}

export interface AdminTrainerTableData {
  trainers: AdminTrainer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
