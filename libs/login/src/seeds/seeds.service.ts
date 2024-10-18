import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@login/login/prisma/prisma.service';
import { rolSuperAdminSeed, superAdminSeed } from './data/superadmin.seed';
import { handleException } from '@login/login/utils';
import * as bcrypt from 'bcrypt';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { modulesSeed } from './data/modules.seed';
import { permissionsSeed } from './data/permissions.seed';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generar el usuario super admin con su rol
   * @returns Super admin creado
   */
  async generateInit(): Promise<HttpResponse<UserData>> {
    try {
      // Obtener todos los módulos y permisos actuales de la base de datos
      const existingModules = await this.prisma.module.findMany();
      const existingPermissions = await this.prisma.permission.findMany();

      // Iniciar una transacción
      const result = await this.prisma.$transaction(async (prisma) => {
        // Filtrar módulos que ya existen para solo agregar los nuevos
        const newModules = modulesSeed.filter(
          (module) => !existingModules.some((existingModule) => existingModule.cod === module.cod)
        );

        // Si hay nuevos módulos, insertarlos
        if (newModules.length > 0) {
          await prisma.module.createMany({
            data: newModules,
            skipDuplicates: true
          });
        }

        // Filtrar permisos que ya existen para solo agregar los nuevos
        const newPermissions = permissionsSeed.filter(
          (permission) =>
            !existingPermissions.some(
              (existingPermission) => existingPermission.cod === permission.cod
            )
        );

        // Si hay nuevos permisos, insertarlos
        if (newPermissions.length > 0) {
          await prisma.permission.createMany({
            data: newPermissions,
            skipDuplicates: true
          });
        }

        // Obtener la lista actualizada de módulos y permisos
        const updatedModulesList = await prisma.module.findMany();
        const updatedPermissionsList = await prisma.permission.findMany();

        // Crear o actualizar las relaciones entre módulos y permisos
        const modulePermissions = [];

        const specificPermissionsMap = new Map<string, string[]>(); // key: moduleId, value: permissionIds
        const generalPermissions = [];
        updatedPermissionsList.forEach((permission) => {
          const isSpecificPermission = updatedModulesList.some((module) =>
            permission.cod.includes(module.cod)
          );

          if (isSpecificPermission) {
            updatedModulesList.forEach((module) => {
              if (permission.cod.includes(module.cod)) {
                if (!specificPermissionsMap.has(module.id)) {
                  specificPermissionsMap.set(module.id, []);
                }
                specificPermissionsMap.get(module.id).push(permission.id);
              }
            });
          } else {
            generalPermissions.push(permission.id);
          }
        });

        // Asignar permisos generales a todos los módulos
        updatedModulesList.forEach((module) => {
          generalPermissions.forEach((permissionId) => {
            modulePermissions.push({
              moduleId: module.id,
              permissionId: permissionId
            });
          });
        });

        // Asignar permisos específicos a módulos específicos
        specificPermissionsMap.forEach((permissionIds, moduleId) => {
          permissionIds.forEach((permissionId) => {
            modulePermissions.push({
              moduleId: moduleId,
              permissionId: permissionId
            });
          });
        });

        // Crear o actualizar las relaciones entre módulos y permisos
        if (modulePermissions.length > 0) {
          await prisma.modulePermissions.createMany({
            data: modulePermissions,
            skipDuplicates: true
          });
        }

        // Crear rol superadmin si no existe
        const superadminRole = await prisma.rol.upsert({
          where: { name_isActive: { name: rolSuperAdminSeed.name, isActive: true } },
          update: {},
          create: rolSuperAdminSeed
        });

        // Asignar permisos del módulo al rol superadmin
        const allModulePermissions = await prisma.modulePermissions.findMany();
        const rolModulePermissionEntries = allModulePermissions.map((modulePermission) => ({
          rolId: superadminRole.id,
          modulePermissionsId: modulePermission.id
        }));

        await prisma.rolModulePermissions.createMany({
          data: rolModulePermissionEntries,
          skipDuplicates: true
        });

        // Crear usuario superadmin y asignarle el rol si no existe
        const superadminUser = await prisma.user.upsert({
          where: { email_isActive: { email: superAdminSeed.email, isActive: true } },
          update: {},
          create: {
            ...superAdminSeed,
            password: await bcrypt.hash(superAdminSeed.password, 10),
            isSuperAdmin: true,
            userRols: {
              create: {
                rolId: superadminRole.id
              }
            }
          }
        });

        return {
          message: 'Super admin created successfully',
          statusCode: HttpStatus.CREATED,
          data: {
            id: superadminUser.id,
            name: superadminUser.name,
            email: superadminUser.email,
            phone: superadminUser.phone,
            isSuperAdmin: superadminUser.isSuperAdmin,
            roles: [
              {
                id: superadminRole.id,
                name: superadminRole.name
              }
            ]
          }
        };
      });

      return result;
    } catch (error) {
      this.logger.error(`Error generating super admin ${superAdminSeed.email}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error generating super admin');
    }
  }
}
