import { Subcategory } from '@prisma/client';

export type SubcategoryData = Pick<Subcategory, 'id' | 'name' | 'isActive'>;
