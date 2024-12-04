import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreateApuBudgetDto,
  CreateApuResourceBudgetDto,
} from './dto/create-apu-budget.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { FullApuBudgetData } from '../interfaces';
import { AuditActionType } from '@prisma/client';
import { roundToFourDecimals, roundToTwoDecimals } from '../utils';

@Injectable()
export class ApuBudgetService {
  private readonly logger = new Logger(ApuBudgetService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcular el costo de un recurso.
   * @param resource Recurso a calcular
   * @param resourceCost Costo del recurso
   * @param workHours Horas de trabajo
   * @param performance Rendimiento del recurso
   * @returns Costo del recurso
   */
  private computeResourceCost(
    resource: CreateApuResourceBudgetDto,
    resourceCost: number,
    workHours: number,
    performance: number,
  ): number {
    // If group exists, use the formula `group` * `workHours` / `performance`
    // to get the value of `quantity`.
    let quantity = resource.quantity;
    if (!!resource.group) {
      const newQuantity = roundToFourDecimals(
        (resource.group * workHours) / performance,
      );

      // If a cuadrilla (group) is sent by the frontend,
      // then the frontend should have also sent a quantity.
      // Assert its value is correct
      if (newQuantity !== quantity) {
        this.logger.error(
          `While creating an APU, one of the resources had a group, and its quantity was wrong.\nresource: ${resource.resourceId}, expected quantity to be ${newQuantity}, got ${quantity}`,
        );
        throw new BadRequestException('Invalid quantity on resource');
      }

      quantity = newQuantity;
    }

    // Compute the cost of this resource
    const computedCost = roundToTwoDecimals(quantity * resourceCost);
    // Assert.equal(computedCost, this.subtotal);

    return computedCost;
  }

  /**
   * Crear un APU de presupuesto.
   * @param createApuBudgetDto Datos para crear el APU
   * @param user Usuario que realiza la acción
   * @returns APU creado
   */
  async create(
    createApuBudgetDto: CreateApuBudgetDto,
    user: UserData,
  ): Promise<HttpResponse<FullApuBudgetData>> {
    const { performance, workHours, resources } = createApuBudgetDto;

    // Recopilar todos los IDs de recursos
    const resourceIds = resources.map((resource) => resource.resourceId);

    // Validar que no haya IDs de recursos duplicados
    const uniqueIds = [...new Set(resourceIds)];
    if (resourceIds.length !== uniqueIds.length) {
      throw new BadRequestException('Duplicated resource IDs');
    }

    // Validar que todos los IDs de recursos existan y estén activos
    const resourcesOnDb =
      uniqueIds.length === 0
        ? []
        : await this.prisma.resource.findMany({
            where: {
              id: { in: uniqueIds },
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              unitCost: true,
              type: true,
              unit: true,
            },
          });

    if (resourcesOnDb.length !== uniqueIds.length) {
      this.logger.error(
        `Resources not found while creating APU. Expected [${uniqueIds.join(', ')}], got [${resourcesOnDb.map((r) => r.id).join(', ')}]`,
      );
      throw new BadRequestException('Resource not found');
    }

    // Mapear recursos para incluir cálculos de costo
    const resourcesWithCost = resources.map((r) => {
      const resourceData = resourcesOnDb.find((r2) => r2.id === r.resourceId)!;
      const cost = this.computeResourceCost(
        r,
        resourceData.unitCost,
        workHours,
        performance,
      );
      return {
        ...r,
        cost,
        resourceData,
      };
    });

    const computedUnitCost = resourcesWithCost.reduce(
      (total, r) => total + r.cost,
      0,
    );

    // Crear el APU y los recursos asociados en una transacción
    const newApuBudget = await this.prisma.$transaction(async (prisma) => {
      const newApu = await prisma.apuBudget.create({
        data: {
          unitCost: computedUnitCost,
          performance,
          workHours,
          apuResource: {
            create: resourcesWithCost.map((r) => ({
              quantity: r.quantity,
              subtotal: r.cost,
              group: r.group?.toString(),
              resourceId: r.resourceId,
            })),
          },
        },
        select: {
          id: true,
          unitCost: true,
          performance: true,
          workHours: true,
          apuResource: {
            select: {
              id: true,
              group: true,
              quantity: true,
              resourceId: true,
            },
          },
        },
      });

      // Crear entradas de auditoría
      const now = new Date();
      const apusAudits = newApu.apuResource.map((a) => ({
        entityId: a.id,
        entityType: 'ApuOnResource',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: now,
      }));

      apusAudits.push({
        entityId: newApu.id,
        entityType: 'Apu',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: now,
      });

      // Insertar auditorías en la base de datos
      await prisma.audit.createMany({
        data: apusAudits,
      });

      return newApu;
    });

    // Mapear los recursos con sus detalles
    const resourceMap = new Map(resourcesOnDb.map((r) => [r.id, r]));
    const fullApuResources = newApuBudget.apuResource.map((r) => ({
      id: r.id,
      group: r.group,
      quantity: r.quantity,
      resource: resourceMap.get(r.resourceId)!,
    }));

    // Construir la respuesta completa
    const fullApuBudgetData: FullApuBudgetData = {
      id: newApuBudget.id,
      unitCost: newApuBudget.unitCost,
      workHours: newApuBudget.workHours,
      performance: newApuBudget.performance,
      apuResource: fullApuResources,
    };

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Client created successfully',
      data: fullApuBudgetData,
    };
  }
}
