import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubworkitemDto } from './dto/create-subworkitem.dto';
import { UpdateSubworkitemDto } from './dto/update-subworkitem.dto';
import { PrismaService } from '@prisma/prisma';
import { ApusService } from '../apus/apus.service';
import { UserData } from '@login/login/interfaces';
import { AuditActionType } from '@prisma/client';
import { DeleteSubWorkItemDto } from './dto/delete-subworkitem.dto';

@Injectable()
export class SubworkitemService {
  private readonly logger = new Logger(SubworkitemService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly apuService: ApusService,
  ) {}

  /**
   * Creates a subworkitem.
   */
  async create(createDto: CreateSubworkitemDto, user: UserData) {
    const { name, unit, apu, parentId } = createDto;

    // Check there isnt a workitem with the same name
    if (!!createDto.name) {
      const other = await this.prisma.subWorkItem.findUnique({
        where: {
          name: createDto.name,
        },
      });
      if (!!other) {
        throw new BadRequestException('Used workitem name');
      }
    }

    // check the parent workitem exists and is active
    const parent = await this.prisma.workItem.findUnique({
      where: {
        id: parentId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!parent) {
      throw new BadRequestException('Parent Work Item not found');
    }

    // Create the subworkitem and connect to the parent
    await this.prisma.$transaction(async (prisma) => {
      // Create the APU
      const createdApu = await this.apuService.create(apu, user);
      const { id: apuId, unitCost } = createdApu.data;

      // Use the APU created to create
      const workItem = await prisma.subWorkItem.create({
        data: {
          name,
          unit,
          apuId,
          unitCost,
          workItem: {
            connect: {
              id: parentId,
            },
          },
        },
      });

      // Audit
      const now = new Date();
      await prisma.audit.create({
        data: {
          entityId: workItem.id,
          entityType: 'WorkItem',
          action: AuditActionType.CREATE,
          performedById: user.id,
          createdAt: now,
        },
      });
    });

    // Success :D
  }

  findAll() {
    return `This action returns all subworkitem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subworkitem`;
  }

  async update(id: string, editDto: UpdateSubworkitemDto, user: UserData) {
    // exit early if there is nothing to do
    if (Object.keys(editDto).length === 0) {
      return;
    }

    // Check there isnt a workitem with the same name
    if (!!editDto.name) {
      const other = await this.prisma.subWorkItem.findUnique({
        where: {
          name: editDto.name,
        },
      });
      if (!!other) {
        throw new BadRequestException('Used workitem name');
      }
    }

    try {
      await this.prisma.subWorkItem.update({
        data: editDto,
        where: {
          id,
          isActive: true,
        },
      });

      // Audit
      const now = new Date();
      this.prisma.audit.create({
        data: {
          entityId: id,
          entityType: 'SubWorkItem',
          action: AuditActionType.UPDATE,
          performedById: user.id,
          createdAt: now,
        },
      });
    } catch (e) {
      this.logger.error(
        `Attempted to insert a unit into a workitem with subitems. Workitem ${id}, unit ${editDto.unit}`,
      );
      this.logger.error(e);
      throw new BadRequestException('Bad workitem update');
    }

    // OK
    return;
  }

  async remove(id: string, user: UserData) {
    // check the sent id exists and is active
    const subworkitem = await this.prisma.subWorkItem.findUnique({
      where: {
        id,
        isActive: true,
      },
    });
    if (!subworkitem) {
      throw new NotFoundException('Subworkitem not found');
    }

    await this.prisma.$transaction(async (prisma) => {
      // mark this subitem as inactive
      await prisma.subWorkItem.update({
        data: {
          isActive: false,
        },
        where: {
          id,
        },
      });

      // log audit
      const now = new Date();
      this.prisma.audit.create({
        data: {
          entityId: id,
          entityType: 'SubWorkItem',
          action: AuditActionType.DELETE,
          performedById: user.id,
          createdAt: now,
        },
      });
    });
  }

  async reactivateAll(user: UserData, ids: DeleteSubWorkItemDto) {
    // check the ids exist
    const subworkitem = await this.prisma.subWorkItem.findMany({
      where: {
        id: {
          in: ids.ids,
        },
      },
    });

    if (ids.ids.length !== subworkitem.length) {
      throw new NotFoundException('Subworkitem not found');
    }

    // reactivate all
    await this.prisma.$transaction(async (prisma) => {
      await prisma.subWorkItem.updateMany({
        data: {
          isActive: true,
        },
        where: {
          id: {
            in: ids.ids,
          },
        },
      });

      // create audit logs
      const now = new Date();
      const auditsEls = ids.ids.map((id) => ({
        entityId: id,
        entityType: 'SubWorkItem',
        action: AuditActionType.UPDATE,
        performedById: user.id,
        createdAt: now,
      }));

      await this.prisma.audit.createMany({
        data: auditsEls,
      });
    });
  }
}
