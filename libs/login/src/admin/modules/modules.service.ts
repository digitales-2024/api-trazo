import { Injectable, Logger } from '@nestjs/common';
import { Module } from '@login/login/interfaces';
import { PrismaService } from '@login/login/prisma/prisma.service';
import { handleException } from '@login/login/utils';

@Injectable()
export class ModulesService {
  private readonly logger = new Logger(ModulesService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Visualiza todos los módulos registrados en la base de datos
   * @returns Los módulos registrados en la base de datos
   */
  async findAll(): Promise<Module[]> {
    try {
      return await this.prisma.module.findMany({
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
    } catch (error) {
      this.logger.error('Error getting modules', error.stack);
      handleException(error, 'Error getting modules');
    }
  }

  /**
   * Visualiz un módulo en específico
   * @param id Id del módulo a buscar
   * @returns Datos del módulo encontrado
   */
  async findOne(id: string): Promise<Module & { id: string }> {
    try {
      const moduleDB = await this.prisma.module.findUnique({
        where: { id }
      });

      if (!moduleDB) {
        throw new Error(`Module with id: ${id} not found`);
      }

      return {
        id: moduleDB.id,
        cod: moduleDB.cod,
        name: moduleDB.name,
        description: moduleDB.description
      };
    } catch (error) {
      this.logger.error(`Error getting module with id: ${id}`, error.stack);
      handleException(error, `Error getting module`);
    }
  }
}
