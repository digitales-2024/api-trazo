import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWarehouseData } from '../interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditActionType } from '@prisma/client';
import { UserData } from '@login/login/interfaces';
import { handleException } from '@login/login/utils';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un almacén para un proyecto de ejecución
   * @param idExecutionProject Identificador del proyecto de ejec
   * @param user Usuario que realiza la acción
   * @returns Datos del almacén creado
   */
  async create(
    idExecutionProject: string,
    user: UserData,
  ): Promise<CreateWarehouseData> {
    let newWarehouse;

    try {
      // Crear el almacen por proyecto
      newWarehouse = await this.prisma.$transaction(async () => {
        // Crear el nuevo cliente
        const warehouse = await this.prisma.warehouse.create({
          data: {
            executionProjectId: idExecutionProject,
          },
          select: {
            id: true,
            executionProject: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        });

        // Registrar la auditoría de la creación del almacén
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: warehouse.id,
            entityType: 'warehouse',
            performedById: user.id,
          },
        });

        return warehouse;
      });

      return {
        id: newWarehouse.id,
        executionProject: newWarehouse.executionProject,
      };
    } catch (error) {
      this.logger.error(
        `Error creating warehouse: ${error.message}`,
        error.stack,
      );

      if (newWarehouse) {
        await this.prisma.warehouse.delete({ where: { id: newWarehouse.id } });
        this.logger.error(
          `Warehouse has been deleted due to error in creation.`,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a warehouse');
    }
  }

  findAll() {
    return `This action returns all warehouse`;
  }

  findOne(id: string) {
    return `This action returns a #${id} warehouse`;
  }
}
