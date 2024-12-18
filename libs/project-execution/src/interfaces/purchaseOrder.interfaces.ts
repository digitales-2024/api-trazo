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
  purchaseOrderDetail: PurchaseOrderDetailData[];
};

export type PurchaseOrderDetailData = {
  id: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  resource: { id: string; name: string };
};

export type SummaryPurchaseOrderData = Pick<
  PurchaseOrder,
  'id' | 'code' | 'orderDate' | 'estimatedDeliveryDate' | 'status'
> & {
  supplierPurchaseOrder: { id: string; name: string };
  requirementsPurchaseOrder: {
    id: string;
    executionProject: { id: string; code: string };
  };
};
