import { Quotation } from '@prisma/client';
import { Pick } from '@prisma/client/runtime/library';

export type QuotationData = Pick<
  Quotation,
  | 'id'
  | 'name'
  | 'code'
  | 'description'
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

export type QuotationDataNested = Pick<
  Quotation,
  | 'id'
  | 'name'
  | 'code'
  | 'description'
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
  levels: Array<LevelData>;
};

type LevelData = {
  id: string;
  name: string;
  spaces: Array<SpaceData>;
};

type SpaceData = {
  id: string;
  name: string;
  amount: number;
  area: number;
};
