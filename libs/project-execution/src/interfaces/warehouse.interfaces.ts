import { Warehouse } from '@prisma/client';

export type CreateWarehouseData = Pick<Warehouse, 'id'> & {
  executionProject: { id: string; code: string };
};
