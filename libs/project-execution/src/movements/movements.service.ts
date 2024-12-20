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
import {
  MovementsData,
  MovementsDetailData,
  SummaryMovementsData,
  WarehouseData,
} from '../interfaces';
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

  /**
   * Busca todos los movimientos
   * @returns Todos los movimientos
   */
  async findAll(): Promise<SummaryMovementsData[]> {
    try {
      const movements = await this.prisma.movements.findMany({
        select: {
          id: true,
          code: true,
          dateMovement: true,
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
          purchaseOrder: {
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

      // Mapea los resultados al tipo SummaryMovementsData
      const summaryMovements = await Promise.all(
        movements.map(async (movement) => {
          return {
            id: movement.id,
            code: movement.code,
            dateMovement: movement.dateMovement,
            type: movement.type,
            description: movement.description,
            warehouse: movement.warehouse,
            purchaseOrder: movement.purchaseOrder,
          };
        }),
      );

      return summaryMovements as SummaryMovementsData[];
    } catch (error) {
      this.logger.error('Error getting all movements');
      handleException(error, 'Error getting all purchase movements');
    }
  }

  /**
   * Busca los movimientos por su tipo
   * @param type Tipo de movimiento (INPUT o OUTPUT)
   * @returns Movimientos por tipo
   */
  async findByType(type: TypeMovements): Promise<SummaryMovementsData[]> {
    try {
      const movements = await this.prisma.movements.findMany({
        where: { type },
        select: {
          id: true,
          code: true,
          dateMovement: true,
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
          purchaseOrder: {
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

      // Mapea los resultados al tipo SummaryMovementsData
      const summaryMovements = await Promise.all(
        movements.map(async (movement) => {
          return {
            id: movement.id,
            code: movement.code,
            dateMovement: movement.dateMovement,
            type: movement.type,
            description: movement.description,
            warehouse: movement.warehouse,
            purchaseOrder: movement.purchaseOrder,
          };
        }),
      );

      return summaryMovements as SummaryMovementsData[];
    } catch (error) {
      this.logger.error('Error getting all movements');
      handleException(error, 'Error getting all purchase movements');
    }
  }

  /**
   * Busca un movimiento por su id
   * @param id Id del movimiento
   * @returns Datos del movimiento
   */
  async findOne(id: string): Promise<MovementsData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get movement');
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      handleException(error, 'Error get movement');
    }
  }

  /**
   * Busca un movimiento por su id con validación
   * @param id Id del movimiento
   * @returns Datos del movimiento
   */
  async findById(id: string): Promise<MovementsData> {
    const movement = await this.prisma.movements.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        dateMovement: true,
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
        movementsDetail: {
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
        },
      },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    return movement;
  }

  /**
   * Busca los movimientos asociados a una orden de compra
   * @param purchaseId Id de la orden de compra
   * @returns Movimientos asociados a la orden de compra
   */
  async findByPurchaseOrderId(purchaseId: string): Promise<MovementsData[]> {
    try {
      const movements = await this.prisma.movements.findMany({
        where: { purchaseId },
        select: {
          id: true,
          code: true,
          dateMovement: true,
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
          movementsDetail: {
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
          },
        },
      });

      return movements;
    } catch (error) {
      this.logger.error('Error getting movements from purchase order');
      handleException(error, 'Error getting movements from purchase order');
    }
  }

  /**
   * Busca los detalles de movimiento faltantes en una orden de compra
   * @param id Id de la orden de compra
   * @returns Detalles de movimiento faltantes
   */
  async findMissingMovementDetail(id: string): Promise<MovementsDetailData[]> {
    try {
      const purchaseOrderDB = await this.purchaseOrderService.findById(id);
      const movementDetails = await this.prisma.movements.findFirst({
        where: { purchaseId: purchaseOrderDB.id },
        select: {
          movementsDetail: {
            select: {
              id: true,
              quantity: true,
              unitCost: true,
              resourceId: true,
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

      if (!movementDetails) {
        throw new NotFoundException(
          'Movement assigned to purchase order not found',
        );
      }

      const purchaseOrderDetails = purchaseOrderDB.purchaseOrderDetail;

      const missingDetails = purchaseOrderDetails
        .map((purchaseDetail) => {
          const totalMovedQuantity = movementDetails.movementsDetail
            .filter(
              (detail) => detail.resource.id === purchaseDetail.resource.id,
            )
            .reduce((sum, detail) => sum + detail.quantity, 0);

          const missingQuantity = purchaseDetail.quantity - totalMovedQuantity;
          const missingQuantityAdjusted =
            missingQuantity > 0 ? missingQuantity : 0;
          const subtotal = missingQuantityAdjusted * purchaseDetail.unitCost;

          return {
            id: purchaseDetail.id,
            quantity: missingQuantityAdjusted,
            unitCost: purchaseDetail.unitCost,
            subtotal: subtotal,
            resource: {
              id: purchaseDetail.resource.id,
              name: purchaseDetail.resource.name,
            },
          };
        })
        .filter((detail) => detail.quantity > 0);

      return missingDetails;
    } catch (error) {
      this.logger.error(
        'Error getting missiong movement details from purchase order',
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      handleException(
        error,
        'Error getting missiong movement details from purchase order',
      );
    }
  }

  /**
   * Actualiza un movimiento
   * @param id Id del movimiento
   * @param updateMovementDto Datos del movimiento a actualizar
   * @param user Usuario que realiza la acción
   * @returns Datos del movimiento actualizado
   */
  async update(
    id: string,
    updateMovementDto: UpdateMovementDto,
    user: UserData,
  ): Promise<HttpResponse<MovementsData>> {
    let existingMovement;
    // Desestructurar los datos actuales y nuevos
    const {
      dateMovement,
      description,
      warehouseId,
      movementDetail = [],
      purchaseId = null,
      type,
    } = updateMovementDto;
    try {
      // Buscar el movimiento existente
      existingMovement = await this.findById(id);
      const warehouseDB = await this.warehouseService.findById(
        existingMovement.warehouse.id,
      );

      const {
        dateMovement: currentDateMovement,
        description: currentDescription,
        purchaseOrder: currentPurchaseOrder,
        warehouse: currentWarehouse,
        type: currentType,
        movementsDetail: currentDetails,
      } = existingMovement;

      // Validar si hay cambios en la cabecera
      const headerChanges =
        dateMovement !== currentDateMovement ||
        description !== currentDescription ||
        warehouseId !== currentWarehouse.id ||
        purchaseId !== (currentPurchaseOrder?.id || null) ||
        type !== currentType;

      const detailChanges = this.detectDetailChanges(
        currentDetails,
        movementDetail,
      );

      // Si no hay cambios en la cabecera ni en los detalles, retornar
      if (!headerChanges && !detailChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Movement successfully updated',
          data: existingMovement,
        };
      }

      // Validar cambios en el stock si se cambia el tipo de movimiento
      if (type && type !== currentType) {
        if (
          currentType === TypeMovements.INPUT &&
          type === TypeMovements.OUTPUT
        ) {
          // Validar stock como si fuera un OUTPUT
          await this.validateStock(type, warehouseDB, movementDetail);
        }
      }

      // Procesar cambios en los detalles del movimiento
      await this.processDetailChanges(
        currentDetails,
        movementDetail,
        type || currentType,
        currentWarehouse.id,
        warehouseDB,
        user,
      );

      // Actualizar la cabecera si hubo cambios
      if (headerChanges) {
        await this.prisma.movements.update({
          where: { id },
          data: {
            dateMovement,
            description,
            type,
            warehouse: warehouseId
              ? { connect: { id: warehouseId } }
              : undefined,
            purchaseOrder: purchaseId
              ? { connect: { id: purchaseId } }
              : currentPurchaseOrder
                ? { disconnect: true }
                : undefined,
          },
        });
      }

      // Registrar la auditoría
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.UPDATE,
          entityId: id,
          entityType: 'movements',
          performedById: user.id,
        },
      });

      // Obtener los datos actualizados del movimiento
      const updatedMovement = await this.findById(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Movement successfully updated',
        data: updatedMovement,
      };
    } catch (error) {
      this.logger.error('Error updating movement', error.stack);

      // Revertir cambios en el stock
      if (movementDetail && existingMovement) {
        const currentDetails = existingMovement.movementsDetail.map((d) => ({
          resourceId: d.resource.id,
          quantity: d.quantity,
          unitCost: d.unitCost,
        }));
        const typeToRevert =
          type && type !== existingMovement.type ? type : existingMovement.type;
        await this.revertStockChanges(
          currentDetails,
          typeToRevert === TypeMovements.INPUT
            ? TypeMovements.OUTPUT
            : TypeMovements.INPUT,
          existingMovement.warehouse.id,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      handleException(error, 'Error updating a movement');
    }
  }

  /**
   * Detecta si hay cambios en los detalles de movimiento.
   */
  private detectDetailChanges(
    currentDetails: any[],
    newDetails: CreateMovementDetailDto[],
  ): boolean {
    const currentDetailIds = new Set(
      currentDetails.map((d) => d.resource?.id).filter((id) => id),
    );
    const newDetailIds = new Set(newDetails.map((d) => d.resourceId));

    // Detectar cambios en el conjunto de detalles
    return (
      currentDetails.some(
        (detail) =>
          !newDetails.some(
            (d) =>
              d.resourceId === detail.resource?.id &&
              d.quantity === detail.quantity &&
              d.unitCost === detail.unitCost,
          ),
      ) ||
      currentDetails.length !== newDetails.length ||
      [...currentDetailIds].some((id) => !newDetailIds.has(id))
    );
  }

  /**
   * Procesa los cambios en los detalles de un movimiento
   */
  private async processDetailChanges(
    currentDetails: any[],
    newDetails: CreateMovementDetailDto[],
    type: TypeMovements,
    warehouseId: string,
    warehouseDB: WarehouseData,
    user: UserData,
  ) {
    const currentDetailMap = new Map(
      currentDetails.map((d) => [d.resource.id, d]),
    );

    // Procesar los nuevos detalles (que son nuevos o modificados)
    for (const detail of newDetails) {
      const existingDetail = currentDetailMap.get(detail.resourceId);

      if (existingDetail) {
        // Si existe el detalle, verificar si hubo cambios
        const isQuantityChanged = detail.quantity !== existingDetail.quantity;
        const isUnitCostChanged = detail.unitCost !== existingDetail.unitCost;

        if (isQuantityChanged || isUnitCostChanged) {
          // Si hay cambios, revertir el detalle en el stock
          await this.revertStockChanges(
            [
              {
                resourceId: detail.resourceId,
                quantity: existingDetail.quantity,
                unitCost: existingDetail.unitCost,
              },
            ],
            type, // Mantenemos el mismo tipo de movimiento
            warehouseId,
          );

          // Actualizar el detalle en la base de datos
          await this.prisma.movementsDetail.update({
            where: { id: existingDetail.id },
            data: {
              quantity: detail.quantity,
              unitCost: detail.unitCost,
              subtotal: detail.quantity * detail.unitCost,
            },
          });

          // Luego aplicar los nuevos cambios al stock
          await this.processMovementDetail(
            [
              {
                resourceId: detail.resourceId,
                quantity: detail.quantity,
                unitCost: detail.unitCost,
              },
            ],
            type,
            warehouseId,
            warehouseDB,
            user,
          );
        }

        // Eliminar el detalle de la lista de detalles existentes
        currentDetailMap.delete(detail.resourceId);
      } else {
        // Si el detalle es nuevo, crear el detalle
        await this.prisma.movementsDetail.create({
          data: {
            quantity: detail.quantity,
            unitCost: detail.unitCost,
            subtotal: detail.quantity * detail.unitCost,
            resourceId: detail.resourceId,
            movementsId: warehouseDB.id,
          },
        });

        // Aplicar los cambios al stock
        await this.processMovementDetail(
          [
            {
              resourceId: detail.resourceId,
              quantity: detail.quantity,
              unitCost: detail.unitCost,
            },
          ],
          type,
          warehouseId,
          warehouseDB,
          user,
        );
      }
    }

    // Eliminar los detalles que ya no están en los nuevos detalles
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, detail] of currentDetailMap) {
      // Primero revertir el stock antes de eliminar el detalle
      await this.revertStockChanges(
        [
          {
            resourceId: detail.resource.id,
            quantity: detail.quantity,
            unitCost: detail.unitCost,
          },
        ],
        type,
        warehouseId,
      );

      // Eliminar el detalle después de revertir los cambios de stock
      await this.prisma.movementsDetail.delete({
        where: { id: detail.id },
      });
    }
  }

  /**
   * Elimina un movimiento
   * @param id Id del movimiento
   * @param user Usuario que realiza la acción
   * @returns Datos del movimiento eliminado
   */
  async remove(
    id: string,
    user: UserData,
  ): Promise<HttpResponse<MovementsData>> {
    try {
      // Verificar que el movimiento existe
      const movement = await this.findById(id);
      // Verificar que el almacén existe
      const warehouseDB = await this.warehouseService.findById(
        movement.warehouse.id,
      );
      // Validar el stock de todos los recursos
      await this.validateStock(
        movement.type === 'INPUT' ? 'OUTPUT' : 'INPUT',
        warehouseDB,
        movement.movementsDetail.map((detail) => ({
          resourceId: detail.resource.id,
          quantity: detail.quantity,
          unitCost: detail.unitCost,
        })),
      );

      // Eliminar los detalles del movimiento
      await this.prisma.movementsDetail.deleteMany({
        where: { movementsId: movement.id },
      });

      // Eliminar el movimiento
      await this.prisma.movements.delete({ where: { id } });

      // Registrar la auditoría
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.DELETE,
          entityId: movement.id,
          entityType: 'movements',
          performedById: user.id,
        },
      });

      // Revertir los cambios en el stock de los recursos con el movimiento eliminado
      await this.revertStockChanges(
        movement.movementsDetail,
        movement.type,
        movement.warehouse.id,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Movement successfully deleted',
        data: movement,
      };
    } catch (error) {
      this.logger.error('Error deleting movement');
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      handleException(error, 'Error deleting movement');
    }
  }
}
