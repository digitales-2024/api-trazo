import { Quotation } from '@prisma/client';

export type QuotationData = Pick<
  Quotation,
  | 'id'
  | 'name'
  | 'code'
  | 'status'
  | 'discount'
  | 'totalAmount'
  | 'deliveryTime'
  | 'exchangeRate'
  | 'landArea'
  | 'paymentSchedule'
  | 'integratedProjectDetails'
  | 'architecturalCost'
  | 'structuralCost'
  | 'electricCost'
  | 'sanitaryCost'
  | 'metering'
> & {
  client: { id: string; name: string };
};
