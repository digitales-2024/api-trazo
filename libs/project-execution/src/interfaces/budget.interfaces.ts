import { Budget } from '@prisma/client';

export type BudgetData = Pick<
  Budget,
  'id' | 'name' | 'codeBudget' | 'ubication' | 'status' | 'dateProject'
> & {
  client: { id: string; name: string };
  designProject: { id: string; code: string };
  budgetDetail: {
    id: string;
    directCost: number;
    overhead: number;
    utility: number;
    igv: number;
    percentageOverhead: number;
    percentageUtility: number;
    totalCost: number;
  };
};
