import { Budget } from '@prisma/client';

export type BudgetData = Pick<
  Budget,
  'id' | 'name' | 'codeBudget' | 'code' | 'ubication' | 'status' | 'dateProject'
> & {
  clientBudget: { id: string; name: string };
  designProjectBudget: { id: string; code: string };
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
