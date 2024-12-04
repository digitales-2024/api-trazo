import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateSubworkitemDto } from './dto/create-subworkitem.dto';
import { UpdateSubworkitemDto } from './dto/update-subworkitem.dto';
import { PrismaService } from '@prisma/prisma';
import { ApusService } from '../apus/apus.service';
import { UserData } from '@login/login/interfaces';
import { AuditActionType } from '@prisma/client';

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

  remove(id: number) {
    return `This action removes a #${id} subworkitem`;
  }
}
