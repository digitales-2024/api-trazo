import { WorkItem } from '@prisma/client';
import { ResourceData } from './resource.interfaces';

export type WorkItemData = Pick<
  WorkItem,
  'id' | 'name' | 'unit' | 'unitCost'
> & {
  apu: {
    id: string;
    unitCost: number;
    performance: number;
    workHours: number;
    apuOnResource: Array<ApuOnResourceData>;
  };
};
type ApuOnResourceData = {
  id: string;
  quantity: number;
  subtotal: number;
  resource: ResourceData;
  group?: number;
};
