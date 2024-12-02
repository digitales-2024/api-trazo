import {
  BadRequestException,
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
    console.log(user);
    // if there is nothing to update, exit early
    const keys = Object.keys(updateApusDto);
    if (keys.length === 0) {
      return;
    }

    // TODO: implement when neccesary
    // get the current APU by id

    // diff resources: delete old resources, edit existing resources, create new resources,

    // revalidate all constraints, regardless of how many things were changed

    // OK

    return `This action updates a #${id} apus<br />\n ${JSON.stringify(updateApusDto, null, 4)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} apus`;
  }
}
