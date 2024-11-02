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
