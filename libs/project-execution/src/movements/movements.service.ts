import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { ResourceService } from '../resource/resource.service';
import { WarehouseService } from '../warehouse/warehouse.service';
import { MovementsData, WarehouseData } from '../interfaces';
import { AuditActionType, ResourceType, TypeMovements } from '@prisma/client';
import { PurchaseOrderService } from '../purchase-order/purchase-order.service';
import { handleException } from '@login/login/utils';
import { CreateMovementDetailDto } from './dto/create-movement-detail.dto';

@Injectable()
export class MovementsService {
  private readonly logger = new Logger(MovementsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly resourceService: ResourceService,
    private readonly warehouseService: WarehouseService,
    private readonly purchaseOrderService: PurchaseOrderService,
  ) {}

  /**
   * Valida el stock de los recursos en el almacén
   * @param type Tipo de movimiento
   * @param warehouseDb Datos del almacén
   * @param movementDetail Detalles del movimiento
   */
  private async validateStock(
    type: TypeMovements,
    warehouseDb: WarehouseData,
    movementDetail: CreateMovementDetailDto[],
  ): Promise<void> {
    if (type === TypeMovements.OUTPUT) {
      for (const detail of movementDetail) {
        const stockItem = warehouseDb.stock.find(
          (item) => item.resource.id === detail.resourceId,
        );

        if (stockItem) {
          if (stockItem.quantity < detail.quantity) {
            throw new BadRequestException(
              `Review the stock of resources. There are insufficient resources`,
            );
          }
        } else {
          throw new BadRequestException(
            `There is no resource in the warehouse`,
          );
        }
      }
    }
  }

  /**
   * Procesa los detalles del movimiento
   * @param movementDetail Detalles del movimiento
   * @param type Tipo de movimiento
   * @param warehouseId Id del almacén
   * @param warehouseDB Datos del almacén
   * @param user Usuario que realiza la acción
   */
  async processMovementDetail(
    movementDetail,
    type,
    warehouseId,
    warehouseDB,
    user,
  ) {
    return await this.prisma.$transaction(async (prisma) => {
      await Promise.all(
        movementDetail.map(async (detail) => {
          const stockItem = warehouseDB.stock.find(
            (item) => item.resource.id === detail.resourceId,
          );

          if (type === TypeMovements.INPUT) {
            if (stockItem) {
              // Si el recurso existe en el stock, sumar la cantidad
              const stockMovement = await prisma.stock.update({
                where: {
                  id: stockItem.id,
                },
                data: {
                  quantity: stockItem.quantity + detail.quantity,
                  totalCost:
                    stockItem.totalCost + detail.quantity * detail.unitCost,
                },
              });
              await this.prisma.audit.create({
                data: {
                  action: AuditActionType.UPDATE,
                  entityId: stockMovement.id,
                  entityType: 'stock',
                  performedById: user.id,
                },
              });
            } else {
              // Si el recurso no existe en el stock, crear un nuevo registro de stock
              const stockMovement = await prisma.stock.create({
                data: {
                  warehouseId,
                  resourceId: detail.resourceId,
                  quantity: detail.quantity,
                  unitCost: detail.unitCost,
                  totalCost: detail.quantity * detail.unitCost,
                },
              });
              await this.prisma.audit.create({
                data: {
                  action: AuditActionType.CREATE,
                  entityId: stockMovement.id,
                  entityType: 'stock',
                  performedById: user.id,
                },
              });
            }
          } else if (type === TypeMovements.OUTPUT) {
            if (stockItem) {
              // Si el recurso existe en el stock, restar la cantidad
              const stockMovement = await prisma.stock.update({
                where: {
                  id: stockItem.id,
                },
                data: {
                  quantity: stockItem.quantity - detail.quantity,
                  totalCost:
                    stockItem.totalCost - detail.quantity * detail.unitCost,
                },
              });
              await this.prisma.audit.create({
                data: {
                  action: AuditActionType.UPDATE,
                  entityId: stockMovement.id,
                  entityType: 'stock',
                  performedById: user.id,
                },
              });
            }
          }
        }),
      );
    });
  }

  /**
   * Revierte los cambios en el stock de los recursos
   * @param movementDetail Detalles del movimiento
   * @param type Tipo de movimiento
   * @param warehouseId Id del almacén
   */
  async revertStockChanges(movementDetail, type, warehouseId) {
    await Promise.all(
      movementDetail.map(async (detail) => {
        const stockItem = await this.prisma.stock.findFirst({
          where: {
            warehouseId,
            resourceId: detail.resourceId,
          },
        });

        if (type === TypeMovements.INPUT) {
          if (stockItem) {
            // Restar la cantidad añadida
            await this.prisma.stock.update({
              where: {
                id: stockItem.id,
              },
              data: {
                quantity: stockItem.quantity - detail.quantity,
                totalCost:
                  stockItem.totalCost - detail.quantity * detail.unitCost,
              },
            });
          }
        } else if (type === TypeMovements.OUTPUT) {
          if (stockItem) {
            // Sumar la cantidad restada
            await this.prisma.stock.update({
              where: {
                id: stockItem.id,
              },
              data: {
                quantity: stockItem.quantity + detail.quantity,
                totalCost:
                  stockItem.totalCost + detail.quantity * detail.unitCost,
              },
            });
          }
        }
      }),
    );
  }

  /**
   * Crea un nuevo movimiento
   * @param createMovementDto Datos del movimiento a crear
   * @param user Usuario que realiza la acción
   * @returns Datos del movimiento creado
   */
  async create(
    createMovementDto: CreateMovementDto,
    user: UserData,
  ): Promise<HttpResponse<MovementsData>> {
    const {
      dateMovement,
      description,
      warehouseId,
      movementDetail,
      purchaseId = null,
    } = createMovementDto;
    const { type } = createMovementDto;
    let newMovement;

    try {
      // Verificar que el almacén existe
      const warehouseDB = await this.warehouseService.findById(warehouseId);

      console.log(
        'warehouseDB que estoy pidiendo',
        JSON.stringify(warehouseDB, null, 2),
      );

      if (purchaseId) {
        // Verificar que la orden de compra existe
        await this.purchaseOrderService.findById(purchaseId);
      }

      // Verificar que los recursos existen y son del tipo Supplies
      await Promise.all(
        movementDetail.map(async (detail) => {
          const resourceDB = await this.resourceService.findById(
            detail.resourceId,
          );
          if (resourceDB.type !== ResourceType.SUPPLIES) {
            throw new BadRequestException(
              `The resource must be of type Supplies`,
            );
          }
        }),
      );

      // Validar el stock de todos los recursos
      await this.validateStock(type, warehouseDB, movementDetail);

      // Crear el movimiento
      newMovement = await this.prisma.movements.create({
        data: {
          dateMovement,
          warehouse: {
            connect: { id: warehouseId },
          },
          type,
          description,
          ...(purchaseId
            ? { purchaseOrder: { connect: { id: purchaseId } } }
            : {}),
        },
        select: {
          id: true,
          dateMovement: true,
          code: true,
          type: true,
          description: true,
          warehouse: {
            select: {
              id: true,
              executionProject: {
                select: {
                  id: true,
                  code: true,
                },
              },
            },
          },
          purchaseOrder: purchaseId
            ? {
                select: {
                  id: true,
                  code: true,
                },
              }
            : false,
        },
      });

      // Crear los detalles del movimiento
      const newMovementsDetails = await Promise.all(
        movementDetail.map(async (detail) => {
          const movementsDetail = await this.prisma.movementsDetail.create({
            data: {
              quantity: detail.quantity,
              unitCost: detail.unitCost,
              subtotal: detail.quantity * detail.unitCost,
              resourceId: detail.resourceId,
              movementsId: newMovement.id,
            },
            select: {
              id: true,
              quantity: true,
              unitCost: true,
              subtotal: true,
              resource: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });
          await this.prisma.audit.create({
            data: {
              action: AuditActionType.CREATE,
              entityId: movementsDetail.id,
              entityType: 'movementsDetail',
              performedById: user.id,
            },
          });
          return movementsDetail;
        }),
      );

      if (movementDetail) {
        await this.processMovementDetail(
          movementDetail,
          type,
          warehouseId,
          warehouseDB,
          user,
        );
      }

      // Registrar la auditoría
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.CREATE,
          entityId: newMovement.id,
          entityType: 'movements',
          performedById: user.id,
        },
      });

      const responseData: MovementsData = {
        id: newMovement.id,
        dateMovement: newMovement.dateMovement,
        code: newMovement.code,
        warehouse: newMovement.warehouse,
        type: newMovement.type,
        description: newMovement.description,
        movementsDetail: newMovementsDetails,
        ...(purchaseId && { purchaseOrder: newMovement.purchaseOrder }),
      };

      // Verificar que el almacén existe
      const warehouseAfcterDB =
        await this.warehouseService.findById(warehouseId);
      console.log(
        'warehouseAfcterDB',
        JSON.stringify(warehouseAfcterDB, null, 2),
      );
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Movement successfully created',
        data: responseData,
      };
    } catch (error) {
      this.logger.error(
        `Error creating movement: ${error.message}`,
        error.stack,
      );

      if (newMovement) {
        await this.prisma.movementsDetail.deleteMany({
          where: { movementsId: newMovement.id },
        });
        await this.prisma.movements.delete({
          where: { id: newMovement.id },
        });
        if (movementDetail) {
          await this.revertStockChanges(movementDetail, type, warehouseId);
        }

        this.logger.error(
          `Movement has been deleted due to error in creation.`,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a movement');
    }
  }

  findAll() {
    return `This action returns all movements`;
  }

  findOne(id: string) {
    return `This action returns a #${id} movement`;
  }

  update(id: string, updateMovementDto: UpdateMovementDto) {
    return `This action updates a #${id} ${updateMovementDto}movement`;
  }

  remove(id: string) {
    return `This action removes a #${id} movement`;
  }
}
