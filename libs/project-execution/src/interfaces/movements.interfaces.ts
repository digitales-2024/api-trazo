import { Movements, TypeMovementName } from '@prisma/client';

export type MovementsData = Pick<Movements, 'id' | 'code' | 'dateMovement'> & {
  typeMovement: { id: string; name: TypeMovementName; description: string };
  movementsDetail: MovementsDetailData[];
};

export type MovementsDetailData = {
  id: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  resource: { id: string; name: string };
};
