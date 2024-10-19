import { User } from '@prisma/client';
import { Rol } from './index';

export type UserPayload = Pick<
  User,
  | 'id'
  | 'name'
  | 'email'
  | 'isActive'
  | 'phone'
  | 'mustChangePassword'
  | 'lastLogin'
  | 'isSuperAdmin'
> & {
  roles: Omit<Rol, 'description'>[];
};

export type UserData = Omit<UserPayload, 'isActive' | 'mustChangePassword' | 'lastLogin'>;

export type UserDataLogin = Pick<UserPayload, 'id' | 'name' | 'email' | 'phone' | 'roles'> & {
  token: string;
};
