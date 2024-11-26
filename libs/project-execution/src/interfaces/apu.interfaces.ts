import { Apu, ApuOnResource, Resource } from '@prisma/client';

export type ApuReturn = Pick<
  Apu,
  'id' | 'unitCost' | 'workHours' | 'performance'
>;

type ApuResourceReturn = Pick<ApuOnResource, 'id' | 'group' | 'quantity'> & {
  resource: Pick<Resource, 'id' | 'name' | 'unitCost' | 'type' | 'unit'>;
};

export type ApuReturnNested = Apu & {
  apuResource: Array<ApuResourceReturn>;
};
