import { Category } from '@prisma/client';

export type CategoryData = Pick<Category, 'id' | 'name' | 'isActive'>;

export type FullCategoryData = Pick<Category, 'id' | 'name' | 'isActive'> & {
  type: string;
  subcategories: SubcategoryData[];
};

type SubcategoryData = {
  id: string;
  name: string;
  isActive: boolean;
  workItems: WorkItemData[];
};

type WorkItemData = {
  id: string;
  name: string;
  unit?: string;
  unitCost?: number;
  apuId?: string;
  isActive: boolean;
  subWorkItem?: SubWorkItemData[];
};

type SubWorkItemData = {
  id: string;
  name: string;
  unit?: string;
  unitCost?: number;
  apuId?: string;
  isActive: boolean;
};
