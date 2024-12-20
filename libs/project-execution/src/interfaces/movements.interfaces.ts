import { Movements } from '@prisma/client';

export type MovementsData = Pick<
  Movements,
  'id' | 'code' | 'dateMovement' | 'type' | 'description'
> & {
  warehouse: { id: string; executionProject: { id: string; code: string } };
  purchaseOrder?: { id: string; code: string };
  movementsDetail: MovementsDetailData[];
};

export type MovementsDetailData = {
  id: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  resource: { id: string; name: string };
};

export type SummaryMovementsData = Pick<
  Movements,
  'id' | 'code' | 'dateMovement' | 'type' | 'description'
> & {
  warehouse: { id: string; executionProject: { id: string; code: string } };
  purchaseOrder?: { id: string; code: string };
};
