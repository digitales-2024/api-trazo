import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateApuBudgetDto,
  CreateApuResourceBudgetDto,
} from './dto/create-apu-budget.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { FullApuBudgetData, ResourceData } from '../interfaces';
import { AuditActionType } from '@prisma/client';
import { roundToFourDecimals, roundToTwoDecimals } from '../utils';
import { handleException } from '@login/login/utils';
import { UpdateApuBudgetDto } from './dto/update-apu-budget.dto';

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
              group: r.group,
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

  /**
   * Buscar un APU por ID.
   * @param id ID del APU
   * @returns APU encontrado
   */
  async findOne(id: string): Promise<FullApuBudgetData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get APU Budget');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get APU Budget');
    }
  }

  /**
   * Buscar un APU por ID.
   * @param id ID del APU
   * @returns APU encontrado
   */
  async findById(id: string): Promise<FullApuBudgetData> {
    // Buscar el APU por ID
    const apuDb = await this.prisma.apuBudget.findFirst({
      where: { id },
      select: {
        id: true,
        unitCost: true,
        workHours: true,
        performance: true,
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

    // Verificar si el APU existe
    if (!apuDb) {
      throw new BadRequestException('This APU does not exist');
    }

    // Recopilar los IDs de los recursos asociados al APU
    const resourceIds = apuDb.apuResource.map((r) => r.resourceId);

    // Buscar los recursos asociados en la base de datos
    const resourcesOnDb = await this.prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
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

    if (resourcesOnDb.length !== resourceIds.length) {
      this.logger.error(
        `Resources not found while fetching APU. Expected [${resourceIds.join(', ')}], got [${resourcesOnDb.map((r) => r.id).join(', ')}]`,
      );
      throw new BadRequestException('Some resources not found');
    }

    // Mapear los recursos con sus detalles
    const fullApuResources = apuDb.apuResource.map((r) => {
      const resourceData = resourcesOnDb.find(
        (resource) => resource.id === r.resourceId,
      )!;
      return {
        id: r.id,
        group: r.group,
        quantity: r.quantity,
        resource: resourceData,
      };
    });

    // Construir la respuesta completa
    const fullApuBudgetData: FullApuBudgetData = {
      id: apuDb.id,
      unitCost: apuDb.unitCost,
      workHours: apuDb.workHours,
      performance: apuDb.performance,
      apuResource: fullApuResources,
    };

    return fullApuBudgetData;
  }

  /**
   * Actualizar un APU de presupuesto.
   * @param id ID del APU a actualizar
   * @param updateApuBudgetDto Datos para actualizar el APU
   * @param user Usuario que realiza la acción
   * @returns APU actualizado
   */
  async update(
    id: string,
    updateApuBudgetDto: UpdateApuBudgetDto,
    user: UserData,
  ): Promise<HttpResponse<FullApuBudgetData>> {
    const { performance, workHours, resources } = updateApuBudgetDto;
    try {
      // Buscar el APU existente junto con sus recursos
      const existingApu = await this.prisma.apuBudget.findFirst({
        where: { id },
        include: { apuResource: true },
      });

      if (!existingApu) {
        throw new BadRequestException('This APU Budget does not exist');
      }

      // Recopilar IDs de recursos actuales y de la solicitud
      const existingResourceIds = existingApu.apuResource.map(
        (r) => r.resourceId,
      );
      const incomingResourceIds = resources
        ? resources.map((r) => r.resourceId)
        : [];

      // Validar que no haya IDs de recursos duplicados en la solicitud
      if (resources) {
        const uniqueIncomingIds = [...new Set(incomingResourceIds)];
        if (incomingResourceIds.length !== uniqueIncomingIds.length) {
          throw new BadRequestException(
            'Resource IDs in the request are duplicated',
          );
        }
      }

      // Identificar recursos a eliminar y a agregar
      const resourcesToDelete = existingResourceIds.filter(
        (id) => !incomingResourceIds.includes(id),
      );
      const resourcesToAdd = incomingResourceIds.filter(
        (id) => !existingResourceIds.includes(id),
      );
      const resourcesToUpdate = incomingResourceIds.filter((id) =>
        existingResourceIds.includes(id),
      );

      // Validar que los nuevos recursos existan y estén activos
      let resourcesOnDb: ResourceData[] = [];
      if (resourcesToAdd.length > 0 || resourcesToUpdate.length > 0) {
        resourcesOnDb = await this.prisma.resource.findMany({
          where: {
            id: { in: [...resourcesToAdd, ...resourcesToUpdate] },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            unitCost: true,
            type: true,
            unit: true,
            isActive: true,
          },
        });

        const expectedResources = [...resourcesToAdd, ...resourcesToUpdate];
        if (resourcesOnDb.length !== expectedResources.length) {
          this.logger.error(
            `Resources not found when updating the APU. Expected [${expectedResources.join(
              ', ',
            )}], obtained [${resourcesOnDb.map((r) => r.id).join(', ')}]`,
          );
          throw new BadRequestException(
            'Some resources not found or are inactive',
          );
        }
      }

      // Determinar si hay cambios en performance o workHours
      const isPerformanceChanged =
        performance !== undefined && performance !== existingApu.performance;
      const isWorkHoursChanged =
        workHours !== undefined && workHours !== existingApu.workHours;
      const isUnitCostChanged = isPerformanceChanged || isWorkHoursChanged;
      const areResourcesChanged =
        resourcesToDelete.length > 0 ||
        resourcesToAdd.length > 0 ||
        resourcesToUpdate.length > 0;

      // Si no hay cambios en performance, workHours y recursos, solo auditar
      if (!isUnitCostChanged && !areResourcesChanged) {
        // Crear una entrada de auditoría sin cambios
        const now = new Date();
        const audits = [
          {
            entityId: existingApu.id,
            entityType: 'Apu',
            action: AuditActionType.UPDATE,
            performedById: user.id,
            createdAt: now,
          },
        ];

        await this.prisma.audit.createMany({
          data: audits,
        });

        // Obtener los recursos actuales con detalles
        const resourcesOnDbCurrent = await this.prisma.resource.findMany({
          where: {
            id: { in: existingResourceIds },
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

        const resourceMapCurrent = new Map(
          resourcesOnDbCurrent.map((r) => [r.id, r]),
        );

        const fullApuResources = existingApu.apuResource.map((r) => ({
          id: r.id,
          group: r.group,
          quantity: r.quantity,
          resource: resourceMapCurrent.get(r.resourceId)!,
        }));

        return {
          statusCode: HttpStatus.OK,
          message: 'APU Budget updated successfully',
          data: {
            id: existingApu.id,
            unitCost: existingApu.unitCost,
            workHours: existingApu.workHours,
            performance: existingApu.performance,
            apuResource: fullApuResources,
          },
        };
      }

      // Iniciar una transacción para actualizar el APU y sus recursos
      const updatedApuBudget = await this.prisma.$transaction(
        async (prisma) => {
          // Eliminar recursos que ya no están presentes
          if (resourcesToDelete.length > 0) {
            await prisma.apuOnResourceBudget.deleteMany({
              where: {
                apuId: id,
                resourceId: { in: resourcesToDelete },
              },
            });
          }

          // Agregar nuevos recursos
          if (resourcesToAdd.length > 0 && resources) {
            const newResources = resources
              .filter((r) => resourcesToAdd.includes(r.resourceId))
              .map((r) => {
                const resourceData = resourcesOnDb.find(
                  (res) => res.id === r.resourceId,
                );
                return {
                  quantity: r.quantity,
                  subtotal: r.quantity * resourceData.unitCost,
                  group: r.group,
                  resourceId: r.resourceId,
                  apuId: id,
                };
              });

            await prisma.apuOnResourceBudget.createMany({
              data: newResources,
            });
          }

          // Actualizar recursos existentes si es necesario
          if (resourcesToUpdate.length > 0 && resources) {
            for (const resource of resources) {
              if (resourcesToUpdate.includes(resource.resourceId)) {
                const resourceData = resourcesOnDb.find(
                  (res) => res.id === resource.resourceId,
                );
                await prisma.apuOnResourceBudget.updateMany({
                  where: {
                    apuId: id,
                    resourceId: resource.resourceId,
                  },
                  data: {
                    quantity: resource.quantity,
                    subtotal: resource.quantity * resourceData.unitCost,
                    group: resource.group,
                  },
                });
              }
            }
          }

          // Recalcular unitCost si es necesario
          let computedUnitCost = existingApu.unitCost;
          if (isUnitCostChanged || areResourcesChanged) {
            const allResources = await prisma.apuOnResourceBudget.findMany({
              where: { apuId: id },
              // No se incluye 'resource' aquí ya que no existe una relación
            });

            // Obtener todos los Resource IDs necesarios para calcular unitCost
            const resourceIdsForUnitCost = allResources.map(
              (r) => r.resourceId,
            );

            const resourcesForUnitCost = await this.prisma.resource.findMany({
              where: { id: { in: resourceIdsForUnitCost } },
              select: { id: true, unitCost: true },
            });

            const resourceCostMap = new Map(
              resourcesForUnitCost.map((r) => [r.id, r.unitCost]),
            );

            computedUnitCost = allResources.reduce(
              (total, r) =>
                total + r.quantity * (resourceCostMap.get(r.resourceId) || 0),
              0,
            );
          }

          // Actualizar el ApuBudget
          const updatedApu = await prisma.apuBudget.update({
            where: { id },
            data: {
              unitCost:
                isUnitCostChanged || areResourcesChanged
                  ? computedUnitCost
                  : existingApu.unitCost,
              performance:
                performance !== undefined
                  ? performance
                  : existingApu.performance,
              workHours:
                workHours !== undefined ? workHours : existingApu.workHours,
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
          const apusAudits = updatedApu.apuResource.map((a) => ({
            entityId: a.id,
            entityType: 'ApuOnResource',
            action: AuditActionType.UPDATE,
            performedById: user.id,
            createdAt: now,
          }));

          apusAudits.push({
            entityId: updatedApu.id,
            entityType: 'Apu',
            action: AuditActionType.UPDATE,
            performedById: user.id,
            createdAt: now,
          });

          await prisma.audit.createMany({
            data: apusAudits,
          });

          return updatedApu;
        },
      );

      // Obtener detalles de los recursos actualizados
      const resourceIdsAfterUpdate = updatedApuBudget.apuResource.map(
        (r) => r.resourceId,
      );
      const resourcesOnDbAfterUpdate = await this.prisma.resource.findMany({
        where: {
          id: { in: resourceIdsAfterUpdate },
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

      const resourceMap = new Map(
        resourcesOnDbAfterUpdate.map((r) => [r.id, r]),
      );

      const fullApuResources = updatedApuBudget.apuResource.map((r) => ({
        id: r.id,
        group: r.group,
        quantity: r.quantity,
        resource: resourceMap.get(r.resourceId)!,
      }));

      // Construir la respuesta completa
      const fullApuBudgetData: FullApuBudgetData = {
        id: updatedApuBudget.id,
        unitCost: updatedApuBudget.unitCost,
        workHours: updatedApuBudget.workHours,
        performance: updatedApuBudget.performance,
        apuResource: fullApuResources,
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'ApuBudget updated successfully',
        data: fullApuBudgetData,
      };
    } catch (error) {
      this.logger.error(`Error updating client: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a client');
    }
  }
}
