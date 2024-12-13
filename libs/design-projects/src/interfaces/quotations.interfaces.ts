import { Quotation } from '@prisma/client';

/**
 * Defines the fields in the integral project.
 */
export type ProjectSchema = {
  architecturalProject: Array<ProjectField>;
  structuralProject: Array<ProjectField>;
  electricalProject: Array<ProjectField>;
  sanitaryProject: Array<ProjectField>;
};

type ProjectField = {
  /**
   * Name of the field. E.g. "Plano de ubicación y localización"
   */
  name: string;
  /**
   * Unit of the field. E.g. "escala 1/1000"
   */
  unit: string;
};

/**
 * Defines the fields in the payment schema
 */
export type PaymentSchedule = {
  payments: Array<Payment>;
};

type Payment = {
  /**
   * Name of the payment.
   *
   * E.g. "Inicial firma de contrato"
   */
  name: string;
  /**
   * Percentage of the toal payment, as a whole number out of 100%
   *
   * E.g. 30
   */
  percentage: number;
  /**
   * Text to the side of the payment schedule.
   * E.g. "Inicio de diseño\nAprobacion por parte de..."
   */
  description: string;
};

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
  | 'createdAt'
> & {
  client: { id: string; name: string };
};

export type QuotationSummaryData = Pick<
  Quotation,
  'id' | 'name' | 'status' | 'totalAmount' | 'metering' | 'publicCode'
> & {
  client: { id: string; name: string };
  zoning: { id: string; zoneCode: string };
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
  | 'createdAt'
  | 'publicCode'
> & {
  client: { id: string; name: string };
  zoning: {
    id: string;
    zoneCode: string;
    buildableArea: number;
    openArea: number;
  };
  levels: Array<LevelData>;
};

export type LevelData = {
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
