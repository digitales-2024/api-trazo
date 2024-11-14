import { Resource } from '@prisma/client';

// Tipo base para datos de Resource
export type ResourceData = Pick<
  Resource,
  'id' | 'type' | 'name' | 'unit' | 'unitCost' | 'isActive'
>;

// Para listados resumidos si se necesitan
export type ResourceSummaryData = Pick<
  Resource,
  'id' | 'type' | 'name' | 'isActive'
>;

// Para datos anidados si se necesitan
export type ResourceDataNested = Omit<Resource, 'createdAt' | 'updatedAt'>;
