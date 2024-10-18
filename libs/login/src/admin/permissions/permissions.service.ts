import { Injectable, Logger } from '@nestjs/common';
import { Permission } from '@login/login/interfaces';
import { PrismaService } from '@login/login/prisma/prisma.service';
import { handleException } from '@login/login/utils';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Visualiza todos los permisos registrados en la base de datos
   * @returns Los permisos registrados en la base de datos
   */
  async findAll(): Promise<Permission[]> {
    try {
      const permissions = await this.prisma.permission.findMany({
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          cod: true,
          name: true,
          description: true
        }
      });

      return permissions;
    } catch (error) {
      this.logger.error('Error getting permissions', error.stack);
      handleException(error, 'Error getting permissions');
    }
  }

  /**
   * Visualiza un permiso en específico
   * @param id Id del permiso a buscar
   * @returns Datos del permiso encontrado
   */
  async findOne(id: string): Promise<Permission & { id: string }> {
    try {
      const permissionDB = await this.prisma.permission.findUnique({
        where: { id }
      });

      if (!permissionDB) {
        throw new Error(`Permission with id: ${id} not found`);
      }

      return {
        id: permissionDB.id,
        cod: permissionDB.cod,
        name: permissionDB.name,
        description: permissionDB.description
      };
    } catch (error) {
      this.logger.error(`Error getting permission with id: ${id}`, error.stack);
      handleException(error, `Error getting permission`);
    }
  }
}
