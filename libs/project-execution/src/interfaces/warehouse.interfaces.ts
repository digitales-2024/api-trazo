import { Warehouse } from '@prisma/client';

export type CreateWarehouseData = Pick<Warehouse, 'id'> & {
  executionProject: { id: string; code: string };
};

export type WarehouseData = Pick<Warehouse, 'id'> & {
  executionProject: { id: string; code: string };
  stock: {
    id: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    resource: {
      id: string;
      name: string;
    };
  }[];
};
