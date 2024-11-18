import { Resource } from '@prisma/client';

// Tipo base para datos de Resource
export type ResourceData = Pick<
  Resource,
  'id' | 'type' | 'name' | 'unit' | 'unitCost' | 'isActive'
>;
