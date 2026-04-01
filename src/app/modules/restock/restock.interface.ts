import { RestockPriority } from '@prisma/client';

export type IRestockRequest = {
  stockToAdd: number;
};

export type IRestockQueueFilter = {
  searchTerm?: string;
  priority?: RestockPriority;
};
