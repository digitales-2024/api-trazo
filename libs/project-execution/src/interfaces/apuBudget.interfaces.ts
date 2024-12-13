import { ApuBudget, ApuOnResourceBudget, Resource } from '@prisma/client';

export type ApuBudgetData = Pick<
  ApuBudget,
  'id' | 'unitCost' | 'workHours' | 'performance'
>;

type ApuResourceBudgetData = Pick<
  ApuOnResourceBudget,
  'id' | 'group' | 'quantity'
> & {
  resource: Pick<Resource, 'id' | 'name' | 'unitCost' | 'type' | 'unit'>;
};

export type FullApuBudgetData = ApuBudgetData & {
  apuResource: Array<ApuResourceBudgetData>;
};
