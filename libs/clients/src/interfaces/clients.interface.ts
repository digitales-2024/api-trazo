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

export type ClientDescriptionData = Pick<
  Client,
  | 'id'
  | 'name'
  | 'phone'
  | 'rucDni'
  | 'address'
  | 'province'
  | 'department'
  | 'isActive'
> & {
  description: ClientData[];
};
