import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { PrismaService } from '@login/login/prisma/prisma.service';
import { handleException } from '@login/login/utils';
import { ValidRols } from '../auth/interfaces';
import { UpdateRolDto } from './dto/update-rol.dto';
import { HttpResponse, RolPermissions, RolModulesPermissions, Rol, UserData } from '@login/login/interfaces';
import { DeleteRolesDto } from './dto/delete-roles.dto';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class RolService {
  private readonly logger = new Logger(RolService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Crear un nuevo rol
   * @param createRolDto Datos del rol a crear
   * @param user Usuario que crea el rol
   * @returns Datos del rol creado
   */
  async create(createRolDto: CreateRolDto): Promise<HttpResponse<Rol>> {
    try {
      const { name, description, rolPermissions } = createRolDto;

      // Verificar si el rol ya existe y está activo
      const rolExist = await this.prisma.rol.findUnique({
        where: {
          name_isActive: {
            name,
            isActive: true
          }
        }
      });

      if (rolExist) {
        throw new ConflictException('Role already exists');
      }

      // Crear el nuevo rol
      const newRol = await this.prisma.$transaction(async (prisma) => {
        // Crear el rol
        const createdRol = await prisma.rol.create({
          data: {
            name,
            description
          },
          select: { id: true, name: true, description: true }
        });

        // Verificar existencia de permisos y construir las entradas para RolModulePermissions
        const rolPermissionEntries = [];
        for (const modulePermissionId of rolPermissions) {
          const modulePermission = await prisma.modulePermissions.findUnique({
            where: {
              id: modulePermissionId
            }
          });

          if (!modulePermission) {
            throw new BadRequestException(
              `ModulePermission with ID ${modulePermissionId} does not exist.`
            );
          }

          rolPermissionEntries.push({
            rolId: createdRol.id,
            modulePermissionsId: modulePermissionId
          });
        }

        // Crear las relaciones entre rol y permisos en una transacción
        await prisma.rolModulePermissions.createMany({
          data: rolPermissionEntries,
          skipDuplicates: true
        });

        return createdRol;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Role created successfully',
        data: newRol
      };
    } catch (error) {
      this.logger.error(`Error creating a role with name: ${createRolDto.name}`, error.stack);

      if (error instanceof ConflictException || BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error creating role. Please try again.');
    }
  }

  /**
   * Actualiza un rol existente en la base de datos por su id.
   * @param id Id del rol a actualizar
   * @param updateRolDto Datos del rol a actualizar
   * @returns Datos del rol actualizado
   */
  async update(id: string, updateRolDto: UpdateRolDto): Promise<HttpResponse<RolPermissions>> {
    try {
      const { name, description, rolPermissions } = updateRolDto;

      // Validar que el rol no sea SUPER_ADMIN
      const rolIsSuperAdmin = await this.isRolSuperAdmin(id);
      if (rolIsSuperAdmin) {
        throw new BadRequestException('Cannot update the role because it is super admin');
      }

      // Validar que haya datos para actualizar
      if (this.isNoDataUpdate(updateRolDto)) {
        throw new BadRequestException('No data to update');
      }

      // Validar que el nombre del rol no sea SUPER_ADMIN
      if (name === ValidRols.SUPER_ADMIN) {
        throw new BadRequestException('Role name cannot be SUPER_ADMIN');
      }

      // Verificar si el nombre ya existe
      if (name) {
        const existingRole = await this.findByName(name);
        if (existingRole) {
          const { id: existingRoleId } = existingRole;
          if (existingRoleId !== id) {
            throw new ConflictException('Role already exists with this name');
          }
        }
      }

      // Buscar el rol en la base de datos
      const roleInDb = await this.findById(id);
      if (!roleInDb) {
        throw new NotFoundException('Role not found');
      }
      // Iniciar una transacción para actualizar el rol y sus permisos
      const updatedRole: RolPermissions = await this.prisma.$transaction(async (prisma) => {
        // Actualizar el rol con los nuevos datos
        const updatedRoleData = await prisma.rol.update({
          where: { id },
          data: {
            name,
            description
          },
          select: {
            id: true,
            name: true,
            description: true
          }
        });

        // Eliminar permisos antiguos del rol
        await prisma.rolModulePermissions.deleteMany({
          where: { rolId: id }
        });

        // Validar existencia de permisos y construir nuevas entradas
        const rolModulePermissionEntries = [];
        if (rolPermissions && rolPermissions.length > 0) {
          for (const modulePermissionId of rolPermissions) {
            const modulePermission = await prisma.modulePermissions.findUnique({
              where: {
                id: modulePermissionId
              },
              select: {
                module: {
                  select: {
                    id: true,
                    cod: true,
                    name: true,
                    description: true
                  }
                },
                permission: {
                  select: {
                    id: true,
                    cod: true,
                    name: true,
                    description: true
                  }
                }
              }
            });

            if (!modulePermission) {
              throw new BadRequestException(
                `ModulePermission with ID ${modulePermissionId} does not exist.`
              );
            }

            rolModulePermissionEntries.push({
              rolId: id,
              modulePermissionsId: modulePermissionId
            });
          }

          // Crear nuevas relaciones entre rol y permisos
          await prisma.rolModulePermissions.createMany({
            data: rolModulePermissionEntries,
            skipDuplicates: true
          });
        }

        // Devolver datos actualizados del rol
        const rolPermissionsDB = await prisma.rolModulePermissions.findMany({
          where: { rolId: id },
          select: {
            modulePermissions: {
              select: {
                module: {
                  select: {
                    id: true,
                    cod: true,
                    name: true,
                    description: true
                  }
                },
                permission: {
                  select: {
                    id: true,
                    cod: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          }
        });

        // Agrupar permisos por módulo
        const groupedByModule = rolPermissionsDB.reduce((acc, rolModulePermission) => {
          const moduleId = rolModulePermission.modulePermissions.module.id;
          const module = rolModulePermission.modulePermissions.module;
          const permission = rolModulePermission.modulePermissions.permission;

          if (!acc[moduleId]) {
            acc[moduleId] = {
              module,
              permissions: []
            };
          }

          acc[moduleId].permissions.push(permission);

          return acc;
        }, {} as RolModulesPermissions[]);
        return {
          ...updatedRoleData,
          rolPermissions: groupedByModule
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Role updated successfully',
        data: updatedRole
      };
    } catch (error) {
      this.logger.error(`Error updating role with id: ${id}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      handleException(error, 'Error updating role');
    }
  }

  /**
   * Eliminar un rol existente en la base de datos por su id
   * @param id Id del rol a eliminar
   * @returns  Datos del rol eliminado
   */
  async remove(id: string): Promise<HttpResponse<Rol>> {
    try {
      // Validar fuera de la transacción
      const rolIsSuperAdmin = await this.isRolSuperAdmin(id);
      if (rolIsSuperAdmin) {
        throw new BadRequestException(
          'It is not possible to delete the rol because it is super admin'
        );
      }

      const rolIsUsed = await this.rolIsUsed(id);
      if (rolIsUsed) {
        throw new BadRequestException('It is not possible to delete the rol because it is in use');
      }

      const rolIsUsedByInactiveUsers = await this.rolIsUsedByInactiveUsers(id);

      // Inicia la transacción
      const removedRol = await this.prisma.$transaction(async (prisma) => {
        //Eliminar el rol, y las relaciones en RolModulePermissions se eliminarán automáticamente por la cascada
        let rolDelete: Rol;
        if (rolIsUsedByInactiveUsers) {
          rolDelete = await prisma.rol.update({
            where: { id },
            data: {
              isActive: false
            }
          });
        } else {
          rolDelete = await prisma.rol.delete({
            where: { id }
          });
        }

        return {
          id: rolDelete.id,
          name: rolDelete.name,
          description: rolDelete.description
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Rol deleted',
        data: removedRol
      };
    } catch (error) {
      this.logger.error(`Error deleting a rol for id: ${id}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error deleting a rol');
    }
  }

  /**
   * Eliminar todos los roles de un arreglo
   * @param roles Arreglo de roles a desactivar
   * @param user Usuario que desactiva los roles
   * @returns Retorna un mensaje de la eliminacion correcta
   */
  async removeAll(roles: DeleteRolesDto, user: UserData): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los roles en la base de datos
        const rolesDB = await prisma.rol.findMany({
          where: {
            id: { in: roles.ids }
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        });

        // Validar que se encontraron roles
        if (rolesDB.length === 0) {
          throw new NotFoundException('Users not found or inactive');
        }

        // Validar algunos de id es el de usuario superadmin
        const superAdminRoles = rolesDB.filter((r) => r.name === ValidRols.SUPER_ADMIN);
        if (superAdminRoles.length > 0) {
          throw new BadRequestException('You cannot deactivate a superadmin role');
        }

        // Validar si alguno de los roles esta en uso
        const rolesInUse = await Promise.all(rolesDB.map((role) => this.rolIsUsed(role.id)));
        if (rolesInUse.some((inUse) => inUse)) {
          throw new BadRequestException('You cannot deactivate a role in use');
        }

        // Desactivar roles y eliminar roles
        const deactivatePromises = rolesDB.map(async (rolDelete) => {
          const rolIsUsedByInactiveUsers = await this.rolIsUsedByInactiveUsers(rolDelete.id);
          if (rolIsUsedByInactiveUsers) {
            // Desactivar usuario
            await prisma.rol.update({
              where: { id: rolDelete.id },
              data: { isActive: false }
            });
          } else {
            // Eliminar roles
            await prisma.rol.delete({
              where: { id: rolDelete.id }
            });
          }

          // Auditoría
          await this.auditService.create({
            entityId: rolDelete.id,
            entityType: 'rol',
            action: AuditActionType.DELETE,
            performedById: user.id,
            createdAt: new Date()
          });

          return {
            id: rolDelete.id,
            name: rolDelete.name,
            description: rolDelete.description
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Users deactivated successfully'
      };
    } catch (error) {
      this.logger.error('Error deactivating users', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error deactivating users');
    }
  }

  /**
   * Reactivar todos los roles de un arreglo
   * @param roles Arreglo de roles a reactivar
   * @param user Usuario que reactiva los roles
   */
  async reactivateAll(roles: DeleteRolesDto, user: UserData): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los roles en la base de datos
        const rolesDB = await prisma.rol.findMany({
          where: {
            id: { in: roles.ids }
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        });

        // Validar que se encontraron roles
        if (rolesDB.length === 0) {
          throw new NotFoundException('Users not found or inactive');
        }

        // Validar algunos de id es el de usuario superadmin
        const superAdminRoles = rolesDB.filter((r) => r.name === ValidRols.SUPER_ADMIN);
        if (superAdminRoles.length > 0) {
          throw new BadRequestException('You cannot reactivate a superadmin role');
        }

        // Reactivar roles
        const reactivatePromises = rolesDB.map(async (rolReactivate) => {
          await prisma.rol.update({
            where: { id: rolReactivate.id },
            data: { isActive: true }
          });

          // Auditoría
          await this.auditService.create({
            entityId: rolReactivate.id,
            entityType: 'rol',
            action: AuditActionType.UPDATE,
            performedById: user.id,
            createdAt: new Date()
          });

          return {
            id: rolReactivate.id,
            name: rolReactivate.name,
            description: rolReactivate.description
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Users reactivated successfully'
      };
    } catch (error) {
      this.logger.error('Error reactivating users', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error reactivating users');
    }
  }

  /**
   * Obtener todos los roles con sus módulos y permisos
   * @returns Lista de roles con módulos y permisos
   */
  async findAll(user: UserData): Promise<RolPermissions[]> {
    try {
      // Recupera todos los roles activos con sus permisos asociados
      const roles = await this.prisma.rol.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }),
          NOT: {
            name: ValidRols.SUPER_ADMIN
          }
        },
        include: {
          rolModulePermissions: {
            include: {
              modulePermissions: {
                include: {
                  module: true, // Incluye el módulo asociado
                  permission: true // Incluye el permiso asociado
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Agrupa permisos por módulos
      const groupedRoles = roles.map((role) => {
        const modulesMap = new Map<string, { module: any; permissions: any }>();

        role.rolModulePermissions.forEach((rolModulePermission) => {
          const moduleId = rolModulePermission.modulePermissions.moduleId;

          if (!modulesMap.has(moduleId)) {
            modulesMap.set(moduleId, {
              module: {
                id: rolModulePermission.modulePermissions.module.id,
                cod: rolModulePermission.modulePermissions.module.cod,
                name: rolModulePermission.modulePermissions.module.name,
                description: rolModulePermission.modulePermissions.module.description
              },
              permissions: []
            });
          }

          modulesMap.get(moduleId)?.permissions.push({
            ...rolModulePermission.modulePermissions.permission,
            idModulePermission: rolModulePermission.modulePermissions.id
          });
        });

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
          rolPermissions: Array.from(modulesMap.values())
        };
      });

      return groupedRoles;
    } catch (error) {
      this.logger.error('Error getting roles with modules and permissions', error.stack);
      throw new Error('Error getting roles with modules and permissions');
    }
  }

  /**
   * Encuentra un rol por su id y devuelve los datos del rol con módulos y permisos
   * @param id Id del rol a buscar
   * @returns Datos del rol encontrado con módulos y permisos agrupados
   */
  async findById(id: string): Promise<RolPermissions> {
    try {
      // Buscar el rol por ID en la base de datos, incluyendo módulos y permisos
      const role = await this.prisma.rol.findUnique({
        where: { id },
        include: {
          rolModulePermissions: {
            include: {
              modulePermissions: {
                include: {
                  module: true, // Incluye el módulo relacionado
                  permission: true // Incluye el permiso relacionado
                }
              }
            }
          }
        }
      });

      // Verificar si el rol existe
      if (!role) {
        throw new NotFoundException(`Role not found`);
      }

      // Agrupar permisos por módulos
      const modulesMap = new Map<string, { module: any; permissions: any[] }>();

      role.rolModulePermissions.forEach((rolModulePermission) => {
        const moduleId = rolModulePermission.modulePermissions.module.id;

        if (!modulesMap.has(moduleId)) {
          modulesMap.set(moduleId, {
            module: {
              id: rolModulePermission.modulePermissions.module.id,
              cod: rolModulePermission.modulePermissions.module.cod,
              name: rolModulePermission.modulePermissions.module.name,
              description: rolModulePermission.modulePermissions.module.description
            },
            permissions: []
          });
        }

        modulesMap.get(moduleId)?.permissions.push({
          id: rolModulePermission.modulePermissions.permission.id,
          cod: rolModulePermission.modulePermissions.permission.cod,
          name: rolModulePermission.modulePermissions.permission.name,
          description: rolModulePermission.modulePermissions.permission.description
        });
      });

      // Estructurar la respuesta final con rol, módulos y permisos
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        rolPermissions: Array.from(modulesMap.values())
      };
    } catch (error) {
      // Manejo del error en caso de que ocurra una excepción durante la búsqueda
      this.logger.error(`Error finding role with id: ${id}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Error finding role. Please try again.');
    }
  }

  /**
   * Mostrar todos los módulos con sus permisos
   * @returns Lista de módulos con sus permisos
   */
  async findAllModulesPermissions(): Promise<RolModulesPermissions[]> {
    try {
      // Obtener todos los módulos con sus permisos
      const modulesPermissions = await this.prisma.modulePermissions.findMany({
        include: {
          module: {
            select: {
              id: true,
              cod: true,
              name: true,
              description: true
            }
          },
          permission: {
            select: {
              id: true,
              cod: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: {
          moduleId: 'asc'
        }
      });
      return this.groupPermissionsByModule(modulesPermissions);
    } catch (error) {
      this.logger.error('Error getting modules with permissions', error.stack);
      throw new Error('Error getting modules with permissions');
    }
  }

  /**
   * Verificar si no hay datos para actualizar
   * @param updateRolDto Datos del rol a actualizar
   * @returns  True si no hay datos para actualizar, false en caso contrario
   */
  private isNoDataUpdate(updateRolDto: UpdateRolDto): boolean {
    // Implementa la lógica para verificar si no hay datos para actualizar
    return !updateRolDto.name && !updateRolDto.description && !updateRolDto.rolPermissions;
  }

  /**
   * Verifica si un rol es el rol de superadministrador.
   * @param id Id del rol a verificar
   * @returns True si el rol es el rol de superadministrador, false en caso contrario
   */
  async isRolSuperAdmin(id: string): Promise<boolean> {
    const superAdminRoleName = 'SUPER_ADMIN'; // O usa una constante o configuración

    // Buscar el rol por id
    const role = await this.prisma.rol.findUnique({
      where: { id },
      select: { name: true }
    });

    // Verificar si el rol existe y si es el rol de superadministrador
    return role ? role.name === superAdminRoleName : false;
  }

  /**
   * Encuentra un rol por su nombre.
   * @param name Nombre del rol a buscar.
   * @returns Rol encontrado o null si no existe.
   */
  async findByName(name: string): Promise<Rol | null> {
    try {
      return await this.prisma.rol.findUnique({
        where: {
          name_isActive: {
            name,
            isActive: true // Si el rol debe estar activo para ser considerado
          }
        }
      });
    } catch (error) {
      // Manejo de errores si es necesario
      this.logger.error(`Error finding role by name: ${name}`, error.stack);
      throw new BadRequestException('Error finding role by name');
    }
  }

  /**
   * Verificar si el rol está en uso
   * @param id Id del rol a verificar si esta en uso
   */
  async rolIsUsed(id: string): Promise<boolean> {
    const rolIsUsed = await this.prisma.userRol.findFirst({
      where: {
        rolId: id,
        isActive: true,
        user: {
          isActive: true
        }
      }
    });

    return !!rolIsUsed;
  }

  /**
   * Verificar si el rol esta en uso, pero por usuarios inactivos
   * @param id Id del rol a verificar si esta en uso
   * @returns True si el rol esta en uso por usuarios inactivos, false en caso contrario
   */
  async rolIsUsedByInactiveUsers(id: string): Promise<boolean> {
    const rolIsUsed = await this.prisma.user.findMany({
      where: {
        isActive: false,
        userRols: {
          some: {
            rolId: id
          }
        }
      }
    });
    // Devuelve true si el rol está en uso por usuarios inactivos
    return rolIsUsed.length > 0;
  }

  /**
   * Agrupar permisos por modulos
   * @param rolModulePermissions Permisos de un rol
   * @returns Permisos agrupados por módulos
   */
  private groupPermissionsByModule(rolModulePermissions: any[]): RolModulesPermissions[] {
    return rolModulePermissions.reduce((acc, entry) => {
      const { moduleId, module, permission, id } = entry;
      const modulePermission = {
        idModulePermission: id,
        ...permission
      };

      // Verificar si ya existe el módulo en el resultado
      const existingModule = acc.find((item) => item.module.id === moduleId);

      if (existingModule) {
        // Si ya existe, añadir el permiso al array de permisos
        existingModule.permissions.push(modulePermission);
      } else {
        // Si no existe, crear un nuevo módulo con el array de permisos
        acc.push({
          module: {
            id: module.id,
            cod: module.cod,
            name: module.name,
            description: module.description
          },
          permissions: [modulePermission]
        });
      }

      return acc;
    }, []);
  }
}
