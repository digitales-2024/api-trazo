import { Zoning } from '@prisma/client';

export type ZoningData = Pick<
  Zoning,
  'id' | 'zoneCode' | 'description' | 'buildableArea' | 'openArea' | 'isActive'
>;
