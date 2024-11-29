import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateWorkitemDto } from './dto/create-workitem.dto';
import { UpdateWorkitemDto } from './dto/update-workitem.dto';
import { PrismaService } from '@prisma/prisma';
import { UserData } from '@login/login/interfaces';
import { CreateApusDto } from '../apus/dto/create-apus.dto';
import { AuditActionType } from '@prisma/client';
import { ApusService } from '../apus/apus.service';

@Injectable()
export class WorkitemsService {
  private readonly logger = new Logger(WorkitemsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly apuService: ApusService,
  ) {}

  async create(createWorkitemDto: CreateWorkitemDto, user: UserData) {
    // check if APU is present. if so, assign values and link to an APU
    // otherwise, mark this work item as having subworkitems
    const { name, unit, apu } = createWorkitemDto;

    // If unit & apu exist, this is a regular work item
    if (!!unit && !!apu) {
      return await this.createRegular(name, unit, apu, user);
    }
    // If those 2 dont exist, this is a work item with subitems
    else if (!unit && !apu) {
      return await this.createWithSubitems(name, user);
    }
    // Otherwise, we have invalid state. The frontend should only send the 2 states above
    else {
      this.logger.error(
        `INVALID STATE: A work item was attempted to be created, but it contained mixed data. Unit: \`${unit}\`, APU: \`${JSON.stringify(apu)}\` `,
      );
      throw new BadRequestException('Invalid state. Contact an administrator.');
    }
  }

  /**
   * Creates a workitem with an APU
   */
  async createRegular(
    name: string,
    unit: string,
    apu: CreateApusDto,
    user: UserData,
  ) {
    // Create the APU
    const createdApu = await this.apuService.create(apu, user);
    const { id: apuId, unitCost } = createdApu.data;

    // Use the APU created to create
    const workItem = await this.prisma.workItem.create({
      data: {
        name,
        unit,
        apuId,
        unitCost,

        subcategory: {
          connect: {
            id: '11119324-5081-4443-8f01-25837d5c2daa',
          },
        },
      },
    });

    // Audit
    const now = new Date();
    await this.prisma.audit.create({
      data: {
        entityId: workItem.id,
        entityType: 'WorkItem',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: now,
      },
    });

    // success :D
  }

  /**
   * Creates a workitem that will have subitems associated to it.
   */
  async createWithSubitems(name: string, user: UserData) {
    // just create
    const workItem = await this.prisma.workItem.create({
      data: {
        name,
        // TODO: Do not hardcode v:<
        subcategory: {
          connect: {
            id: '11119324-5081-4443-8f01-25837d5c2daa',
          },
        },
      },
      select: {
        id: true,
      },
    });

    // audit
    const now = new Date();
    await this.prisma.audit.create({
      data: {
        entityId: workItem.id,
        entityType: 'WorkItem',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: now,
      },
    });

    // success :D
  }

  async findAll(user: UserData) {
    // Get all workitems
    const workitems = await this.prisma.workItem.findMany({
      select: {
        id: true,
        name: true,
        unit: true,
        unitCost: true,
        apuId: true,
        subWorkItem: {
          select: {
            id: true,
            name: true,
            unit: true,
            unitCost: true,
          },
          where: {
            ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
          },
        },
      },
      where: {
        // if user is superadmin get all
        ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
      },
    });

    // Check all workitems have either a subworkitem, or a relation to apu
    // Get the APUs
    return workitems;
  }

  findOne(id: number) {
    return `This action returns a #${id} workitem`;
  }

  update(id: number, updateWorkitemDto: UpdateWorkitemDto) {
    return `This action updates a #${id} workitem ${updateWorkitemDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} workitem`;
  }
}
