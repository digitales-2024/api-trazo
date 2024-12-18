import { Supplier } from '@prisma/client';

export type SupplierData = Pick<
  Supplier,
  'id' | 'name' | 'ruc' | 'address' | 'phone' | 'email' | 'isActive'
>;

export type SupplierDescriptionData = Pick<
  Supplier,
  'id' | 'name' | 'ruc' | 'address' | 'phone' | 'email' | 'isActive'
> & {
  description: SupplierData[];
};
