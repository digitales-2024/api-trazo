import { Zoning } from '@prisma/client';

export type ZoningData = Pick<
  Zoning,
  | 'id'
  | 'zone_code'
  | 'description'
  | 'buildable_area'
  | 'open_area'
  | 'isActive'
>;
