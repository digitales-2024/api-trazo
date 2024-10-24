import { Client } from '@prisma/client';

export type ClientData = Pick<
  Client,
  | 'id'
  | 'name'
  | 'phone'
  | 'rucDni'
  | 'address'
  | 'province'
  | 'department'
  | 'isActive'
>;
