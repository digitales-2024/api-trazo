import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateApuResourceDto, CreateApusDto } from './dto/create-apus.dto';
import { UpdateApusDto } from './dto/update-apus.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData } from '@login/login/interfaces';

import { AuditActionType } from '@prisma/client';
import { roundToTwoDecimals } from '../utils';

@Injectable()
export class ApusService {
  private readonly logger = new Logger(ApusService.name);
  constructor(private readonly prisma: PrismaService) { }

  async create(
    createApusDto: CreateApusDto,
    user: UserData,
  ): Promise<HttpResponse<null>> {
    const { unitCost, performance, workHours, resources } = createApusDto;

    // Collect all the resources ids
    const resourceIds = resources.map((resource) => resource.resourceId);

    // Validate no resource id is duplicated
    const uniqueIds = [...new Set(resourceIds)];
    if (resourceIds.length !== uniqueIds.length) {
      throw new BadRequestException('Duplicated resource IDs');
    }

    // Validate all resource ids exist
    const resourcesOnDb = await this.prisma.resource.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
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
    const computedUnitCost = resources
      .map((r) => {
        const resourceCost = resourcesOnDb.find(
          (r2) => r2.id === r.resourceId,
        ).unitCost;
        return this.computeResourceCost(
          r,
          resourceCost,
          workHours,
          performance,
        );
      })
      .reduce((x, y) => x + y, 0);
    if (computedUnitCost !== unitCost) {
      this.logger.error(
        `While creating an APU, the unit cost computed on the backend didnt match the one sent by the frontend.\nExpected unitCost to be ${computedUnitCost}, got ${unitCost}`,
      );
      throw new BadRequestException('Invalid unit cost');
    }

    await this.prisma.$transaction(async (prisma) => {
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
    });

    return {
      data: null,
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
      const newQuantity = roundToTwoDecimals((resource.group * workHours) / performance);

      // If a cuadrilla (group) is sent by the frontend,
      // then the frontedn should have also sent a quantity.
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

  findAll() {
    return `This action returns all apus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apus`;
  }

  update(id: number, updateApusDto: UpdateApusDto) {
    return `This action updates a #${id} apus`;
  }

  remove(id: number) {
    return `This action removes a #${id} apus`;
  }
}
