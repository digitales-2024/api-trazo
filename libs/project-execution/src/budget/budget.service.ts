import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { BudgetData } from '../interfaces';
import { ClientsService } from '@clients/clients';
import { ProjectService } from '@design-projects/design-projects/project/project.service';
import { AuditActionType } from '@prisma/client';
import { handleException } from '@login/login/utils';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientsService,
    private readonly designProjectService: ProjectService,
  ) {}

  private async generateCodeBudget(): Promise<string> {
    // Generar el siguiente código incremental
    const lastProject = await this.prisma.budget.findFirst({
      where: { code: { startsWith: 'PRS-DIS-' } },
      orderBy: { code: 'desc' }, // Orden descendente
    });

    const lastIncrement = lastProject
      ? parseInt(lastProject.code.split('-')[2], 10)
      : 0;
    const projectCode = `PRS-DIS-${String(lastIncrement + 1).padStart(3, '0')}`;
    return projectCode;
  }

  /**
   * Crear un nuevo presupuesto
   * @param createBudgetDto Datos del presupuesto a crear
   * @param user Usuario que realiza la petición
   * @returns Datos del presupuesto creado
   */
  async create(
    createBudgetDto: CreateBudgetDto,
    user: UserData,
  ): Promise<HttpResponse<BudgetData>> {
    const {
      name,
      ubication,
      dateProject,
      clientId,
      designProjectId,
      directCost,
      overhead,
      igv,
      utility,
      percentageOverhead,
      percentageUtility,
      totalCost,
    } = createBudgetDto;
    let newBudget;
    let newBudgetDetail;
    let designProjectDB = null; // Inicializar como null

    try {
      // Generar el código del presupuesto
      const projectCode = await this.generateCodeBudget();
      await this.clientService.findById(clientId);
      if (designProjectId) {
        designProjectDB =
          await this.designProjectService.findById(designProjectId);
        if (designProjectDB.status !== 'APPROVED') {
          throw new BadRequestException('The design project must be approved');
        }
      }
      // Crear el presupuesto y registrar la auditoría
      newBudget = await this.prisma.$transaction(async () => {
        // Crear el nuevo presupuesto
        const budget = await this.prisma.budget.create({
          data: {
            name,
            ubication,
            dateProject,
            clientId,
            designProjectId,
            code: projectCode,
          },
          select: {
            id: true,
            name: true,
            status: true,
            code: true,
            dateProject: true,
            ubication: true,
            codeBudget: true,
            clientBudget: {
              select: {
                id: true,
                name: true,
              },
            },
            designProjectId: true,
          },
        });

        // Registrar la auditoría de la creación del presupuesto
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: budget.id,
            entityType: 'budget',
            performedById: user.id,
          },
        });

        return budget;
      });

      // Crear el detalle del presupuesto y registrar la auditoría
      newBudgetDetail = await this.prisma.$transaction(async () => {
        // Crear el nuevo detalle del presupuesto
        const budgetDetail = await this.prisma.budgetDetail.create({
          data: {
            directCost,
            overhead,
            igv,
            utility,
            percentageOverhead,
            percentageUtility,
            totalCost,
            budgetId: newBudget.id,
          },
          select: {
            id: true,
            directCost: true,
            overhead: true,
            igv: true,
            utility: true,
            percentageOverhead: true,
            percentageUtility: true,
            totalCost: true,
          },
        });

        // Registrar la auditoría de la creación del detalle del presupuesto
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: budgetDetail.id,
            entityType: 'budgetDetail',
            performedById: user.id,
          },
        });

        return budgetDetail;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Budget created successfully',
        data: {
          id: newBudget.id,
          name: newBudget.name,
          codeBudget: newBudget.codeBudget,
          code: newBudget.code,
          ubication: newBudget.ubication,
          status: newBudget.status,
          dateProject: newBudget.dateProject,
          clientBudget: newBudget.clientBudget,
          designProjectBudget: designProjectDB
            ? {
                id: designProjectDB.id,
                code: designProjectDB.code,
              }
            : null,
          budgetDetail: newBudgetDetail,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating budget: ${error.message}`, error.stack);

      if (newBudget) {
        await this.prisma.budgetDetail.delete({
          where: { id: newBudgetDetail.id },
        });
        await this.prisma.budget.delete({ where: { id: newBudget.id } });
        this.logger.error(`Budget has been deleted due to error in creation.`);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a budget');
    }
  }

  findAll() {
    return `This action returns all budget`;
  }

  findOne(id: number) {
    return `This action returns a #${id} budget`;
  }

  update(id: number, updateBudgetDto: UpdateBudgetDto) {
    return `This action updates a #${id}  ${updateBudgetDto} budget`;
  }

  remove(id: number) {
    return `This action removes a #${id} budget`;
  }
}
