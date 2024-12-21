import { Supplier } from '@prisma/client';

export type SupplierData = Pick<
  Supplier,
  | 'id'
  | 'name'
  | 'ruc'
  | 'address'
  | 'phone'
  | 'email'
  | 'department'
  | 'province'
  | 'isActive'
>;

export type SupplierDescriptionData = Pick<
  Supplier,
  | 'id'
  | 'name'
  | 'ruc'
  | 'address'
  | 'phone'
  | 'email'
  | 'department'
  | 'province'
  | 'isActive'
> & {
  description: SupplierData[];
};
