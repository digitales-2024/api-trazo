import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWarehouseData, WarehouseData } from '../interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditActionType, ExecutionProjectStatus } from '@prisma/client';
import { UserData, UserPayload } from '@login/login/interfaces';
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
        // Crear el nuevo almacen
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

  /**
   * Obtiene todos los almacenes
   * @param user Usuario que realiza la acción
   * @returns Lista de almacenes
   */
  async findAll(user: UserPayload): Promise<CreateWarehouseData[]> {
    const activeStates: ExecutionProjectStatus[] = [
      'STARTED',
      'EXECUTION',
      'COMPLETED',
    ];

    try {
      const warehouses = await this.prisma.warehouse.findMany({
        where: {
          ...(user.isSuperAdmin
            ? {}
            : {
                executionProject: {
                  status: {
                    in: activeStates,
                  },
                },
              }),
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
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo CreateWarehouseData
      return warehouses.map((warehouse) => ({
        id: warehouse.id,
        executionProject: warehouse.executionProject,
      })) as CreateWarehouseData[];
    } catch (error) {
      this.logger.error('Error getting all warehouses');
      handleException(error, 'Error getting all warehouses');
    }
  }

  /**
   * Obtiene un almacén por su identificador
   * @param id Identificador del almacén
   * @returns Datos del almacén
   */
  async findOne(id: string): Promise<WarehouseData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get warehouse');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get warehouse');
    }
  }

  /**
   * Obtiene un almacén por su identificador con validación
   * @param id Identificador del almacén
   * @returns Datos completos del almacén con su stock
   */
  async findById(id: string): Promise<WarehouseData> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      select: {
        id: true,
        executionProject: {
          select: {
            id: true,
            code: true,
          },
        },
        stock: {
          select: {
            id: true,
            quantity: true,
            unitCost: true,
            totalCost: true,
            resource: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse as unknown as WarehouseData;
  }

  /**
   * Obtiene un almacén por el identificador de un proyecto de ejecución
   * @param id Identificador del proyecto de ejecución
   * @returns Datos completos del almacén con su stock
   */
  async findWarehouseByExeuctionProject(id: string): Promise<WarehouseData> {
    const warehouse = await this.prisma.executionProject.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        warehouse: {
          select: {
            id: true,
            stock: {
              select: {
                id: true,
                quantity: true,
                unitCost: true,
                totalCost: true,
                resource: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(
        'Warehouse assigned to execution project not found',
      );
    }

    return warehouse as unknown as WarehouseData;
  }
}
