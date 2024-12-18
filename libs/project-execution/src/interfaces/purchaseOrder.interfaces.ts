import { PurchaseOrder } from '@prisma/client';

export type PurchaseOrderData = Pick<
  PurchaseOrder,
  'id' | 'code' | 'orderDate' | 'estimatedDeliveryDate' | 'status'
> & {
  supplierPurchaseOrder: { id: string; name: string };
  requirementsPurchaseOrder: {
    id: string;
    executionProject: { id: string; code: string };
  };
  purchaseOrderDetail: {
    id: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    resource: { id: string; name: string };
  }[];
};
