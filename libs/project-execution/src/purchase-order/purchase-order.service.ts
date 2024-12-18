import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { PurchaseOrderData } from '../interfaces';
import { PrismaService } from '@prisma/prisma';
import { ResourceService } from '../resource/resource.service';
import { SupplierService } from '../supplier/supplier.service';
import { handleException } from '@login/login/utils';
import { AuditActionType } from '@prisma/client';

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
  private async generateCodeBudget(): Promise<string> {
    // Generar el siguiente código incremental
    const lastProject = await this.prisma.budget.findFirst({
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
      const projectCode = await this.generateCodeBudget();

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
          return await this.prisma.purchaseOrderDetail.create({
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
        await this.prisma.budget.delete({ where: { id: newPurchaseOrder.id } });
        this.logger.error(`Budget has been deleted due to error in creation.`);
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

  findAll() {
    return `This action returns all purchaseOrder`;
  }

  findOne(id: string) {
    return `This action returns a #${id} purchaseOrder`;
  }

  update(id: string, updatePurchaseOrderDto: UpdatePurchaseOrderDto) {
    return `This action updates a #${id} ${updatePurchaseOrderDto} purchaseOrder`;
  }

  remove(id: string) {
    return `This action removes a #${id} purchaseOrder`;
  }
}
