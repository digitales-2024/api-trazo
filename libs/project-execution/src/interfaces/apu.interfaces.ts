import { Apu } from '@prisma/client';

export type ApuReturn = Pick<
  Apu,
  'id' | 'unitCost' | 'workHours' | 'performance'
>;
