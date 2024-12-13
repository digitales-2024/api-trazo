import { Rol as RolPrisma } from '@prisma/client';
import { Permission } from './permission.interface';
import { Module } from './module.interface';

export type Rol = Pick<RolPrisma, 'id' | 'name' | 'description'>;

export type RolPermissions = {
  id: string;
  name: string;
  description?: string;
  rolPermissions: RolModulesPermissions[];
};

export interface ModulePermissionDto {
  moduleId: string;
  permissionIds: string[];
}

export interface RolModulesPermissions {
  module: Module;
  permissions: Permission[];
}
export interface RolModulePermissions {
  rolId: string;
  modulePermissionsId: string;
}
