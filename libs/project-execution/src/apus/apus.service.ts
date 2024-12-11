import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateApuResourceDto, CreateApusDto } from './dto/create-apus.dto';
import { UpdateApusDto } from './dto/update-apus.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData } from '@login/login/interfaces';

import { AuditActionType } from '@prisma/client';
import { roundToTwoDecimals } from '../utils';
import { ApuReturn, ApuReturnNested } from '../interfaces/apu.interfaces';
import { FullApuBudgetData, ResourceData } from '../interfaces';
import { handleException } from '@login/login/utils';

@Injectable()
export class ApusService {
  private readonly logger = new Logger(ApusService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createApusDto: CreateApusDto,
    user: UserData,
  ): Promise<HttpResponse<{ id: string; unitCost: number }>> {
    const { performance, workHours, resources } = createApusDto;

    // Collect all the resources ids
    const resourceIds = resources.map((resource) => resource.resourceId);

    // There is the possibility that the APU is being created without rescources.

    // Validate no resource id is duplicated
    const uniqueIds = [...new Set(resourceIds)];
    if (resourceIds.length !== uniqueIds.length) {
      throw new BadRequestException('Duplicated resource IDs');
    }

    // Validate all resource ids exist
    const resourcesOnDb =
      uniqueIds.length === 0
        ? []
        : await this.prisma.resource.findMany({
            where: {
              id: {
                in: uniqueIds,
              },
              isActive: true,
            },
            select: {
              id: true,
              unitCost: true,
            },
          });

    if (resourcesOnDb.length !== uniqueIds.length) {
      this.logger.error(
        `Resources not found while creating APU. Expected \`${uniqueIds}\`, got \`${resourcesOnDb}\``,
      );
      throw new BadRequestException('Resource not found');
    }

    // Assert the unit cost is correct
    const resourcesWithCost = resources.map((r) => {
      const resourceCost = resourcesOnDb.find(
        (r2) => r2.id === r.resourceId,
      ).unitCost;

      const cost = this.computeResourceCost(
        r,
        resourceCost,
        workHours,
        performance,
      );
      return {
        ...r,
        cost,
      };
    });
    const computedUnitCost = resourcesWithCost.reduce(
      (r1, r2) => r1 + r2.cost,
      0,
    );

    const newApu = await this.prisma.$transaction(async (prisma) => {
      // Create the APU with its associated ApuOnResource
      const newApu = await prisma.apu.create({
        data: {
          unitCost: computedUnitCost,
          performance,
          workHours,
          apuResource: {
            create: resourcesWithCost.map((r) => ({
              quantity: r.quantity,
              subtotal: r.cost,
              group: r.group,
              resource: {
                connect: {
                  id: r.resourceId,
                },
              },
            })),
          },
        },
        select: {
          id: true,
          unitCost: true,
          apuResource: {
            select: {
              id: true,
            },
          },
        },
      });

      // Create objects to create audits, one for each ApuOnResource
      const now = new Date();
      const apusAudits = newApu.apuResource.map((a) => ({
        entityId: a.id,
        entityType: 'ApuOnResource',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: now,
      }));
      // Push audit for the APU
      apusAudits.push({
        entityId: newApu.id,
        entityType: 'Apu',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: now,
      });

      // insert those in the audit db
      await prisma.audit.createMany({
        data: apusAudits,
      });

      return newApu;
    });

    return {
      data: newApu,
      message: '',
      statusCode: 200,
    };
  }

  /**
   * Given `resourceCost`, computes how much this resource costs.
   * `resourceCost` is the cost of the Resource referenced by `resourceId`
   */
  computeResourceCost(
    resource: CreateApuResourceDto,
    resourceCost: number,
    workHours: number,
    performance: number,
  ): number {
    // If group exists, use the formula `group` * `workHours` / `performance`
    // to get the value of `quantity`.
    let quantity = resource.quantity;
    if (!!resource.group) {
      const newQuantity = roundToTwoDecimals(
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

  async findAll(): Promise<Array<ApuReturn>> {
    const apus = await this.prisma.apu.findMany({
      select: {
        id: true,
        unitCost: true,
        workHours: true,
        performance: true,
      },
    });

    return apus;
  }

  async findById(id: string): Promise<ApuReturnNested> {
    const apu = await this.prisma.apu.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        performance: true,
        workHours: true,
        unitCost: true,
        apuResource: {
          select: {
            id: true,
            group: true,
            quantity: true,
            resource: {
              select: {
                id: true,
                name: true,
                unitCost: true,
                type: true,
                unit: true,
              },
            },
            subtotal: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!apu) {
      throw new NotFoundException('Apu not found');
    }

    return apu;
  }

  async update(id: string, updateApusDto: UpdateApusDto, user: UserData) {
    const { performance, workHours, resources } = updateApusDto;
    try {
      // Buscar el APU existente junto con sus recursos
      const existingApu = await this.prisma.apu.findFirst({
        where: { id },
        include: { apuResource: true },
      });

      if (!existingApu) {
        throw new BadRequestException('This APU does not exist');
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
      const updatedApu = await this.prisma.$transaction(async (prisma) => {
        // Eliminar recursos que ya no están presentes
        if (resourcesToDelete.length > 0) {
          await prisma.apuOnResource.deleteMany({
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

          await prisma.apuOnResource.createMany({
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
              await prisma.apuOnResource.updateMany({
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
          const allResources = await prisma.apuOnResource.findMany({
            where: { apuId: id },
            // No se incluye 'resource' aquí ya que no existe una relación
          });

          // Obtener todos los Resource IDs necesarios para calcular unitCost
          const resourceIdsForUnitCost = allResources.map((r) => r.resourceId);

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
        const updatedApu = await prisma.apu.update({
          where: { id },
          data: {
            unitCost:
              isUnitCostChanged || areResourcesChanged
                ? computedUnitCost
                : existingApu.unitCost,
            performance:
              performance !== undefined ? performance : existingApu.performance,
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
      });

      // Obtener detalles de los recursos actualizados
      const resourceIdsAfterUpdate = updatedApu.apuResource.map(
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

      const fullApuResources = updatedApu.apuResource.map((r) => ({
        id: r.id,
        group: r.group,
        quantity: r.quantity,
        resource: resourceMap.get(r.resourceId)!,
      }));

      // Construir la respuesta completa
      const fullApuData: FullApuBudgetData = {
        id: updatedApu.id,
        unitCost: updatedApu.unitCost,
        workHours: updatedApu.workHours,
        performance: updatedApu.performance,
        apuResource: fullApuResources,
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'ApuBudget updated successfully',
        data: fullApuData,
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
