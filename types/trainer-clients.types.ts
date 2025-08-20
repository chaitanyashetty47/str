import { SubscriptionStatus } from "@prisma/client";

export type TrainerClientRow = {
  id: string;
  name: string;
  email: string;
  plan: string | null;
  status: SubscriptionStatus | null;
  joinDate: string | null;
};

export type TrainerClientsFilters = {
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
};

export type TrainerClientsQuery = {
  page: number;
  pageSize: number;
  search?: string;
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  sort?: Array<{
    id: string;
    desc: boolean;
  }>;
};

export type TrainerClientsResponse = {
  rows: TrainerClientRow[];
  total: number;
  pageCount: number;
}; 