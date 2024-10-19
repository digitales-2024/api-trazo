import { ValidRols } from '@login/login/admin/auth/interfaces';

export const superAdminSeed = {
  name: 'Super Admin',
  email: 'admin@admin.com',
  password: 'admin',
  phone: '1234567890',
  mustChangePassword: false
};

export const rolSuperAdminSeed = {
  name: ValidRols.SUPER_ADMIN,
  description: 'Super Administrador'
};
