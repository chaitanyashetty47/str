export type SubscriptionCategory = "FITNESS" | "PSYCHOLOGY" | "MANIFESTATION" | "ALL_IN_ONE";

export interface AdminClientPlan {
  id: string;
  name: string;
  category: SubscriptionCategory;
}

export interface AdminClientTrainer {
  id: string;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  trainerRole: string;
  category: SubscriptionCategory | null;
}

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  activePlans: AdminClientPlan[];
  trainerAssignments: {
    fitness: AdminClientTrainer | null;
    psychology: AdminClientTrainer | null;
    manifestation: AdminClientTrainer | null;
  };
  hasAllInOnePlan: boolean;
}

export interface AdminClientFilters {
  search: string;
  category: "ALL" | SubscriptionCategory;
}

export interface AdminClientTableData {
  clients: AdminClient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
