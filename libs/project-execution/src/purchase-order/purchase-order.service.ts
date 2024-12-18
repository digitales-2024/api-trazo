import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import {
  PurchaseOrderData,
  PurchaseOrderDetailData,
  SummaryPurchaseOrderData,
} from '../interfaces';
import { PrismaService } from '@prisma/prisma';
import { ResourceService } from '../resource/resource.service';
import { SupplierService } from '../supplier/supplier.service';
import { handleException } from '@login/login/utils';
import { AuditActionType, PurchaseOrderStatus } from '@prisma/client';
import { CreatePurchaseOrderDetailDto } from './dto/create-purchase-order-detail.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/update-status-purchase-order.dto';

@Injectable()
export class PurchaseOrderService {
  private readonly logger = new Logger(PurchaseOrderService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly resourceService: ResourceService,
    private readonly supplierService: SupplierService,
  ) {}

  /**
   * Generar el código de una orden de compra
   * @returns Código de la orden de compra
   */
  private async generateCodePurchaseOrder(): Promise<string> {
    // Generar el siguiente código incremental
    const lastProject = await this.prisma.purchaseOrder.findFirst({
      where: { code: { startsWith: 'ORD-CMP-' } },
      orderBy: { code: 'desc' }, // Orden descendente
    });

    const lastIncrement = lastProject
      ? parseInt(lastProject.code.split('-')[2], 10)
      : 0;
    const projectCode = `ORD-CMP-${String(lastIncrement + 1).padStart(3, '0')}`;
    return projectCode;
  }

  /**
   * Crear una orden de compra
   * @param createPurchaseOrderDto Datos de la orden de compra a crear
   * @param user Usuario que realiza la acción
   * @returns Datos de la orden de compra creada
   */
  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    user: UserData,
  ): Promise<HttpResponse<PurchaseOrderData>> {
    const {
      orderDate,
      estimatedDeliveryDate,
      purchaseOrderDetail,
      supplierId,
      requirementsId,
    } = createPurchaseOrderDto;
    let newPurchaseOrder;

    try {
      // Generar el código de la orden de compra
      const projectCode = await this.generateCodePurchaseOrder();

      // Verificar que el proveedor existe
      await this.supplierService.findById(supplierId);

      // Crear la orden de compra
      newPurchaseOrder = await this.prisma.purchaseOrder.create({
        data: {
          orderDate,
          estimatedDeliveryDate,
          supplierId,
          requirementsId,
          code: projectCode,
        },
        select: {
          id: true,
          code: true,
          orderDate: true,
          estimatedDeliveryDate: true,
          status: true,
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          requirements: {
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
        },
      });

      // Crear los detalles de la orden de compra
      const newPurchaseOrderDetails = await Promise.all(
        purchaseOrderDetail.map(async (detail) => {
          await this.resourceService.findById(detail.resourceId);
          const purchaseOrdersDetail =
            await this.prisma.purchaseOrderDetail.create({
              data: {
                quantity: detail.quantity,
                unitCost: detail.unitCost,
                subtotal: detail.subtotal,
                resourceId: detail.resourceId,
                purchaseOrderId: newPurchaseOrder.id,
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
              entityId: purchaseOrdersDetail.id,
              entityType: 'purchaseOrderDetail',
              performedById: user.id,
            },
          });
          return purchaseOrdersDetail;
        }),
      );

      // Registrar la auditoría
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.CREATE,
          entityId: newPurchaseOrder.id,
          entityType: 'purchaseOrder',
          performedById: user.id,
        },
      });

      const responseData: PurchaseOrderData = {
        id: newPurchaseOrder.id,
        code: newPurchaseOrder.code,
        orderDate: newPurchaseOrder.orderDate,
        estimatedDeliveryDate: newPurchaseOrder.estimatedDeliveryDate,
        status: newPurchaseOrder.status,
        supplierPurchaseOrder: {
          id: newPurchaseOrder.supplier.id,
          name: newPurchaseOrder.supplier.name,
        },
        requirementsPurchaseOrder: {
          id: newPurchaseOrder.requirements.id,
          executionProject: {
            id: newPurchaseOrder.requirements.executionProject.id,
            code: newPurchaseOrder.requirements.executionProject.code,
          },
        },
        purchaseOrderDetail: newPurchaseOrderDetails.map((detail) => ({
          id: detail.id,
          quantity: detail.quantity,
          unitCost: detail.unitCost,
          subtotal: detail.subtotal,
          resource: {
            id: detail.resource.id,
            name: detail.resource.name,
          },
        })),
      };

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Purchase order successfully created',
        data: responseData,
      };
    } catch (error) {
      this.logger.error(
        `Error creating purchase order: ${error.message}`,
        error.stack,
      );

      if (newPurchaseOrder) {
        await this.prisma.purchaseOrderDetail.deleteMany({
          where: { id: newPurchaseOrder.id },
        });
        await this.prisma.purchaseOrder.delete({
          where: { id: newPurchaseOrder.id },
        });
        this.logger.error(
          `Purchase order has been deleted due to error in creation.`,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a purchase order');
    }
  }

  /**
   * Obtener todas las órdenes de compra
   * @param user Usuario que realiza la acción
   * @returns Lista de órdenes de compra
   */
  async findAll(user: UserPayload): Promise<SummaryPurchaseOrderData[]> {
    try {
      const purchaseOrders = await this.prisma.purchaseOrder.findMany({
        where: {
          ...(user.isSuperAdmin
            ? {}
            : {
                status: {
                  in: [
                    PurchaseOrderStatus.PENDING,
                    PurchaseOrderStatus.DELIVERED,
                  ],
                },
              }), // Filtrar por status solo si no es super admin
        },
        select: {
          id: true,
          code: true,
          orderDate: true,
          estimatedDeliveryDate: true,
          status: true,
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          requirements: {
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
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo SummaryPurchaseOrderData
      const summaryPurchaseOrders = await Promise.all(
        purchaseOrders.map(async (purchaseOrder) => {
          return {
            id: purchaseOrder.id,
            code: purchaseOrder.code,
            orderDate: purchaseOrder.orderDate,
            estimatedDeliveryDate: purchaseOrder.estimatedDeliveryDate,
            status: purchaseOrder.status,
            supplierPurchaseOrder: {
              id: purchaseOrder.supplier.id,
              name: purchaseOrder.supplier.name,
            },
            requirementsPurchaseOrder: {
              id: purchaseOrder.requirements.id,
              executionProject: {
                id: purchaseOrder.requirements.executionProject.id,
                code: purchaseOrder.requirements.executionProject.code,
              },
            },
          };
        }),
      );

      return summaryPurchaseOrders as SummaryPurchaseOrderData[];
    } catch (error) {
      this.logger.error('Error getting all purchase orders');
      handleException(error, 'Error getting all purchase orders');
    }
  }

  /**
   * Obtener una orden de compra por su id
   * @param id Id de la orden de compra
   * @returns Datos de la orden de compra
   */
  async findOne(id: string): Promise<PurchaseOrderData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get purchase order');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get purchase order');
    }
  }

  /**
   * Obtener una orden de compra por su id con sus validaciones
   * @param id Id de la orden de compra
   * @returns Datos de la orden de compra
   */
  async findById(id: string): Promise<PurchaseOrderData> {
    // Buscar el presupuesto con sus relaciones
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        orderDate: true,
        estimatedDeliveryDate: true,
        status: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        requirements: {
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
        purchaseOrderDetail: {
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

    if (!purchaseOrder) {
      throw new NotFoundException(`This purchase order doesnt exist`);
    }

    // Formatear la respuesta en el tipo esperado
    const response: PurchaseOrderData = {
      id: purchaseOrder.id,
      code: purchaseOrder.code,
      orderDate: purchaseOrder.orderDate,
      estimatedDeliveryDate: purchaseOrder.estimatedDeliveryDate,
      status: purchaseOrder.status,
      supplierPurchaseOrder: {
        id: purchaseOrder.supplier.id,
        name: purchaseOrder.supplier.name,
      },
      requirementsPurchaseOrder: {
        id: purchaseOrder.requirements.id,
        executionProject: {
          id: purchaseOrder.requirements.executionProject.id,
          code: purchaseOrder.requirements.executionProject.code,
        },
      },
      purchaseOrderDetail: purchaseOrder.purchaseOrderDetail.map((detail) => ({
        id: detail.id,
        quantity: detail.quantity,
        unitCost: detail.unitCost,
        subtotal: detail.subtotal,
        resource: {
          id: detail.resource.id,
          name: detail.resource.name,
        },
      })),
    };

    return response;
  }

  /**
   * Obtener una orden de compra por su id con datos resumidos
   * @param id Id de la orden de compra
   * @returns Datos resumidos de la orden de compra
   */
  async findByIdSummaryData(id: string): Promise<SummaryPurchaseOrderData> {
    // Buscar la orden de compra con sus relaciones
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        orderDate: true,
        estimatedDeliveryDate: true,
        status: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        requirements: {
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
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`This purchase order doesnt exist`);
    }

    // Formatear la respuesta en el tipo esperado
    const response: SummaryPurchaseOrderData = {
      id: purchaseOrder.id,
      code: purchaseOrder.code,
      orderDate: purchaseOrder.orderDate,
      estimatedDeliveryDate: purchaseOrder.estimatedDeliveryDate,
      status: purchaseOrder.status,
      supplierPurchaseOrder: {
        id: purchaseOrder.supplier.id,
        name: purchaseOrder.supplier.name,
      },
      requirementsPurchaseOrder: {
        id: purchaseOrder.requirements.id,
        executionProject: {
          id: purchaseOrder.requirements.executionProject.id,
          code: purchaseOrder.requirements.executionProject.code,
        },
      },
    };

    return response;
  }

  /**
   * Actualizar una orden de compra
   * @param id Id de la orden de compra
   * @param updatePurchaseOrderDto Datos de la orden de compra a actualizar
   * @param user Usuario que realiza la acción
   * @returns Datos de la orden de compra actualizada
   */
  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    user: UserData,
  ): Promise<HttpResponse<PurchaseOrderData>> {
    const {
      orderDate,
      estimatedDeliveryDate,
      purchaseOrderDetail,
      supplierId,
      requirementsId,
    } = updatePurchaseOrderDto;

    try {
      // Obtener la orden de compra existente
      const existingPurchaseOrder = await this.findById(id);

      if (!existingPurchaseOrder) {
        throw new NotFoundException('Orden de compra no encontrada');
      }

      // Verificar si hay cambios en los datos de la orden de compra
      const isPurchaseOrderChanged =
        existingPurchaseOrder.orderDate !== orderDate ||
        existingPurchaseOrder.estimatedDeliveryDate !== estimatedDeliveryDate ||
        existingPurchaseOrder.supplierPurchaseOrder.id !== supplierId ||
        existingPurchaseOrder.requirementsPurchaseOrder.id !== requirementsId;

      // Verificar cambios en los detalles de la orden de compra
      const existingDetails = existingPurchaseOrder.purchaseOrderDetail;

      // Mapear detalles existentes por resourceId
      const existingDetailsMap = new Map<string, PurchaseOrderDetailData>();
      existingDetails.forEach((detail) => {
        existingDetailsMap.set(detail.resource.id, detail);
      });

      // Mapear detalles de entrada por resourceId
      const incomingDetailsMap = new Map<
        string,
        CreatePurchaseOrderDetailDto
      >();
      purchaseOrderDetail.forEach((detail) => {
        incomingDetailsMap.set(detail.resourceId, detail);
      });

      let isPurchaseOrderDetailChanged = false;

      // Identificar detalles para actualizar o eliminar
      const detailsToUpdate = [];
      const detailsToDelete = [];

      existingDetails.forEach((existingDetail) => {
        const incomingDetail = incomingDetailsMap.get(
          existingDetail.resource.id,
        );
        if (incomingDetail) {
          // Existe en ambos, verificar si hay cambios
          if (
            existingDetail.quantity !== incomingDetail.quantity ||
            existingDetail.unitCost !== incomingDetail.unitCost ||
            existingDetail.subtotal !== incomingDetail.subtotal
          ) {
            isPurchaseOrderDetailChanged = true;
            detailsToUpdate.push({
              id: existingDetail.id,
              resourceId: existingDetail.resource.id, // Asegúrate de pasar el resourceId
              quantity: incomingDetail.quantity,
              unitCost: incomingDetail.unitCost,
              subtotal: incomingDetail.subtotal,
            });
          }
          // Remover de incomingDetailsMap para no procesar nuevamente
          incomingDetailsMap.delete(existingDetail.resource.id);
        } else {
          // Existe en existentes pero no en entrantes, eliminar
          isPurchaseOrderDetailChanged = true;
          detailsToDelete.push(existingDetail.id);
        }
      });

      // Los detalles restantes en incomingDetailsMap son nuevos para crear
      const detailsToCreate = [];
      incomingDetailsMap.forEach((detail) => {
        isPurchaseOrderDetailChanged = true;
        detailsToCreate.push(detail);
      });

      // Si no hay cambios, retornar mensaje sin actualizar la base de datos
      if (!isPurchaseOrderChanged && !isPurchaseOrderDetailChanged) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Purchase order updated successfully',
          data: existingPurchaseOrder,
        };
      }

      // Iniciar transacción
      await this.prisma.$transaction(async (prisma) => {
        if (isPurchaseOrderChanged) {
          // Actualizar orden de compra
          await prisma.purchaseOrder.update({
            where: { id },
            data: {
              orderDate,
              estimatedDeliveryDate,
              supplierId,
              requirementsId,
            },
          });
        }

        if (isPurchaseOrderDetailChanged) {
          // Eliminar detalles
          if (detailsToDelete.length > 0) {
            await prisma.purchaseOrderDetail.deleteMany({
              where: {
                id: { in: detailsToDelete },
              },
            });
            await prisma.audit.create({
              data: {
                action: AuditActionType.DELETE,
                entityId: id,
                entityType: 'purchaseOrderDetail',
                performedById: user.id,
              },
            });
          }

          // Actualizar detalles
          for (const detail of detailsToUpdate) {
            await this.resourceService.findById(detail.resourceId);
            await prisma.purchaseOrderDetail.update({
              where: { id: detail.id },
              data: {
                quantity: detail.quantity,
                unitCost: detail.unitCost,
                subtotal: detail.subtotal,
              },
            });

            await prisma.audit.create({
              data: {
                action: AuditActionType.UPDATE,
                entityId: detail.id,
                entityType: 'purchaseOrderDetail',
                performedById: user.id,
              },
            });
          }

          // Crear nuevos detalles
          for (const detail of detailsToCreate) {
            await this.resourceService.findById(detail.resourceId);
            await prisma.purchaseOrderDetail.create({
              data: {
                quantity: detail.quantity,
                unitCost: detail.unitCost,
                subtotal: detail.subtotal,
                resourceId: detail.resourceId,
                purchaseOrderId: id,
              },
            });
            await prisma.audit.create({
              data: {
                action: AuditActionType.CREATE,
                entityId: id,
                entityType: 'purchaseOrderDetail',
                performedById: user.id,
              },
            });
          }
        }

        // Registrar auditoría si hubo cambios
        if (isPurchaseOrderChanged || isPurchaseOrderDetailChanged) {
          await prisma.audit.create({
            data: {
              action: AuditActionType.UPDATE,
              entityId: id,
              entityType: 'purchaseOrder',
              performedById: user.id,
            },
          });
        }
      });

      // Obtener la orden de compra actualizada
      const updatedPurchaseOrder = await this.findById(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Purchase order updated successfully',
        data: updatedPurchaseOrder,
      };
    } catch (error) {
      this.logger.error(
        `Error updating purchase order: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a purchase order');
    }
  }

  async updateStatus(
    id: string,
    updatePurchaseOrderStatusDto: UpdatePurchaseOrderStatusDto,
    user: UserData,
  ): Promise<HttpResponse<SummaryPurchaseOrderData>> {
    const newStatus = updatePurchaseOrderStatusDto.newStatus;

    let purchaseOrderDB;

    await this.prisma.$transaction(async (prisma) => {
      purchaseOrderDB = await this.findByIdSummaryData(id);

      if (purchaseOrderDB.status === newStatus) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Purchase order status updated successfully',
          data: {
            id: purchaseOrderDB.id,
            code: purchaseOrderDB.code,
            orderDate: purchaseOrderDB.orderDate,
            estimatedDeliveryDate: purchaseOrderDB.estimatedDeliveryDate,
            status: newStatus,
            supplierPurchaseOrder: purchaseOrderDB.supplierPurchaseOrder,
            requirementsPurchaseOrder:
              purchaseOrderDB.requirementsPurchaseOrder,
          },
        };
      }

      // update the status
      await prisma.purchaseOrder.update({
        where: {
          id,
        },
        data: {
          status: newStatus,
        },
      });

      // store the action in audit
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.UPDATE,
          entityId: purchaseOrderDB.id,
          entityType: 'purchaseOrder',
          performedById: user.id,
        },
      });
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Purchase order status updated successfully',
      data: {
        id: purchaseOrderDB.id,
        code: purchaseOrderDB.code,
        orderDate: purchaseOrderDB.orderDate,
        estimatedDeliveryDate: purchaseOrderDB.estimatedDeliveryDate,
        status: newStatus,
        supplierPurchaseOrder: purchaseOrderDB.supplierPurchaseOrder,
        requirementsPurchaseOrder: purchaseOrderDB.requirementsPurchaseOrder,
      },
    };
  }
}
