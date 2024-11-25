import { Category } from '@prisma/client';

export type CategoryData = Pick<Category, 'id' | 'name' | 'isActive'>;
