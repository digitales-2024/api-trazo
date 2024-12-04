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
  }[];
  category: CategoryBudgetDetails[];
};

export type CategoryBudgetDetails = {
  id: string;
  budgetDetailId?: string;
  name: string;
  subcategory: {
    id: string;
    name: string;
    workitem: {
      id: string;
      name: string;
      unit: string;
      quantity: number;
      unitCost: number;
      subtotal: number;
    }[];
  }[];
};

export type SummaryBudgetData = Pick<
  Budget,
  'id' | 'name' | 'codeBudget' | 'code' | 'ubication' | 'status' | 'dateProject'
> & {
  clientBudget: { id: string; name: string };
  designProjectBudget: { id: string; code: string };
};
