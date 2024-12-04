import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateWorkitemDto } from './dto/create-workitem.dto';
import { UpdateWorkitemDto } from './dto/update-workitem.dto';
import { PrismaService } from '@prisma/prisma';
import { UserData } from '@login/login/interfaces';
import { CreateApusDto } from '../apus/dto/create-apus.dto';
import { AuditActionType } from '@prisma/client';
import { ApusService } from '../apus/apus.service';
import { WorkItemData } from '../interfaces';
import { handleException } from '@login/login/utils';

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
    const { name, unit, apu, subcategoryId } = createWorkitemDto;

    // If unit & apu exist, this is a regular work item
    if (!!unit && !!apu) {
      return await this.createRegular(name, unit, subcategoryId, apu, user);
    }
    // If those 2 dont exist, this is a work item with subitems
    else if (!unit && !apu) {
      return await this.createWithSubitems(name, user, subcategoryId);
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
    subcategoryId: string,
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
            id: subcategoryId,
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
  async createWithSubitems(
    name: string,
    user: UserData,
    subcategoryId: string,
  ) {
    // just create
    const workItem = await this.prisma.workItem.create({
      data: {
        name,
        subcategory: {
          connect: {
            id: subcategoryId,
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

  /**
   * Mostrar un WorkItem con sus datos completos incluyendo el APU relacionado por id
   * @param id id del WorkItem
   * @returns WorkItemData con datos completos
   */
  async findOne(id: string): Promise<WorkItemData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get workItem');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get workItem');
    }
  }

  /**
   * Mostrar un WorkItem con sus datos completos incluyendo el APU relacionado por id
   * @param id id del WorkItem
   * @returns WorkItemData con datos completos
   */
  async findById(id: string): Promise<WorkItemData> {
    // Consulta para Obtener el WorkItem
    const workItemDb = await this.prisma.workItem.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        unit: true,
        unitCost: true,
        isActive: true,
        apuId: true, // Necesitamos apuId para la segunda consulta
      },
    });

    // Verificación de Existencia y Estado del WorkItem
    if (!workItemDb) {
      throw new BadRequestException('This WorkItem does not exist');
    }

    if (!workItemDb.isActive) {
      throw new BadRequestException('This workItem exist but is not active');
    }

    let apuData = {
      id: '',
      unitCost: 0,
      performance: 0,
      workHours: 0,
      apuOnResource: [],
    };

    // Consulta para Obtener el Apu Relacionado si existe apuId
    if (workItemDb.apuId) {
      const apuDb = await this.prisma.apu.findUnique({
        where: { id: workItemDb.apuId },
        include: {
          apuResource: {
            // Incluir ApuOnResource
            include: {
              resource: true, // Incluir Resource dentro de ApuOnResource
            },
          },
        },
      });

      if (apuDb) {
        apuData = {
          id: apuDb.id,
          unitCost: apuDb.unitCost,
          performance: apuDb.performance,
          workHours: apuDb.workHours,
          apuOnResource: apuDb.apuResource.map((ar) => ({
            id: ar.id,
            quantity: ar.quantity,
            subtotal: ar.subtotal,
            group: ar.group,
            resource: {
              id: ar.resource.id,
              type: ar.resource.type,
              name: ar.resource.name,
              unit: ar.resource.unit,
              unitCost: ar.resource.unitCost,
              isActive: ar.resource.isActive,
            },
          })),
        };
      }
    }

    // Mapeo de Datos a WorkItemData
    const workItemData: WorkItemData = {
      id: workItemDb.id,
      name: workItemDb.name,
      unit: workItemDb.unit || '',
      unitCost: workItemDb.unitCost || 0,
      apu: apuData,
    };

    return workItemData;
  }

  update(id: number, updateWorkitemDto: UpdateWorkitemDto) {
    return `This action updates a #${id} workitem ${updateWorkitemDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} workitem`;
  }
}
