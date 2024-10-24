import { Spaces } from '@prisma/client';

export type SpaceData = Pick<
  Spaces,
  'id' | 'name' | 'description' | 'isActive'
>;
