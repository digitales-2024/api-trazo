import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { ClientsService } from '@clients/clients';
import { UsersService } from '@login/login/admin/users/users.service';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { CreateProjectDto } from './dto/create-execution-project.dto';
import { UpdateProjectDto } from './dto/update-execution-project.dto';
import { UpdateProjectStatusDto } from './dto/update-execution-project-status.dto';
import {
  ExecutionProjectData,
  ExecutionProjectSummaryData,
  ExecutionProjectStatusUpdateData,
} from '../interfaces/project.interface';
import { ExecutionProjectStatus } from '@prisma/client';
import { handleException } from '@login/login/utils';
import { BudgetService } from '../budget/budget.service';

@Injectable()
export class ExecutionProjectService {
  private readonly logger = new Logger(ExecutionProjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly budgetService: BudgetService,
    private readonly client: ClientsService,
    private readonly user: UsersService,
  ) {}

  /**
   * Genera un código único para un proyecto de ejecución con el formato PRY-EJE-XXX
   * @returns Código generado para el proyecto
   */
  private async generateCodeProjectExecution(): Promise<string> {
    const lastProject = await this.prisma.executionProject.findFirst({
      where: { code: { startsWith: 'PRY-EJE-' } },
      orderBy: { code: 'desc' },
    });

    const lastIncrement = lastProject
      ? parseInt(lastProject.code.split('-')[2], 10)
      : 0;
    return `PRY-EJE-${String(lastIncrement + 1).padStart(3, '0')}`;
  }

  /**
   * Obtiene todos los proyectos de ejecución que están completados
   * @returns Lista de proyectos de ejecución con estado "COMPLETED"
   */
  async findCompletedExecutionProjects(): Promise<
    ExecutionProjectSummaryData[]
  > {
    try {
      const completedProjects = await this.prisma.executionProject.findMany({
        where: {
          status: 'COMPLETED',
        },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          startProjectDate: true,
          ubicationProject: true,
          department: true,
          province: true,
          client: { select: { id: true, name: true } },
          resident: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return completedProjects as ExecutionProjectSummaryData[];
    } catch (error) {
      this.logger.error(
        'Error fetching completed execution projects',
        error.stack,
      );
      throw new BadRequestException(
        'Error fetching completed execution projects',
      );
    }
  }

  /**
   * Crea un nuevo proyecto de ejecución
   * @param dto - Datos del proyecto de ejecución
   * @param user - Usuario que realiza la acción
   * @returns Proyecto creado
   */
  async create(
    createExecutionProjectDto: CreateProjectDto,
    user: UserData,
  ): Promise<HttpResponse> {
    const {
      name,
      ubicationProject,
      clientId,
      residentId,
      budgetId,
      department,
      province,
      startProjectDate,
    } = createExecutionProjectDto;

    try {
      await this.prisma.$transaction(async (prisma) => {
        const projectCode = await this.generateCodeProjectExecution();

        await this.client.findById(clientId);
        await this.user.findById(residentId);

        const newProject = await prisma.executionProject.create({
          data: {
            code: projectCode,
            name,
            ubicationProject,
            department,
            province,
            startProjectDate,
            client: { connect: { id: clientId } },
            resident: { connect: { id: residentId } },
            budget: { connect: { id: budgetId } },
          },
        });

        await this.audit.create({
          entityId: newProject.id,
          entityType: 'executionProject',
          action: 'CREATE',
          performedById: user.id,
          createdAt: new Date(),
        });
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Execution project created successfully',
        data: null,
      };
    } catch (error) {
      this.logger.error(
        `Error creating execution project: ${error.message}`,
        error.stack,
      );
      handleException(error, 'Error creating execution project');
    }
  }

  /**
   * Obtiene todos los proyectos de ejecución
   * @param user - Usuario que realiza la acción
   * @returns Lista de proyectos
   */
  async findAll(user: UserPayload): Promise<ExecutionProjectSummaryData[]> {
    const activeStates: ExecutionProjectStatus[] = [
      'APPROVED',
      'CANCELLED',
      'STARTED',
      'EXECUTION',
      'COMPLETED',
    ];

    const projects = await this.prisma.executionProject.findMany({
      where: {
        ...(user.isSuperAdmin ? {} : { status: { in: activeStates } }),
      },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        startProjectDate: true,
        ubicationProject: true,
        department: true,
        province: true,
        client: { select: { id: true, name: true } },
        resident: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects as ExecutionProjectSummaryData[];
  }

  /**
   * Busca un proyecto de diseño por ID
   * @param id - ID del proyecto
   * @returns Promise con los datos del proyecto
   * @throws {NotFoundException} Si el proyecto no existe
   */
  async findOne(id: string): Promise<ExecutionProjectData> {
    return this.findById(id);
  }
  /* async findOne(id: string): Promise<ExecutionProjectData> {
    const project = await this.prisma.executionProject.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        startProjectDate: true,
        ubicationProject: true,
        department: true,
        province: true,
        client: { select: { id: true, name: true } },
        resident: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Execution project not found');
    }

    return project as ExecutionProjectData;
  } */

  /**
   * Obtiene información básica de un proyecto por ID
   * @param id - ID del proyecto
   * @returns Promise con los datos básicos del proyecto
   * @throws {NotFoundException} Si el proyecto no existe
   */
  async findById(id: string): Promise<ExecutionProjectData> {
    const project = await this.prisma.executionProject.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        startProjectDate: true,
        ubicationProject: true,
        department: true,
        province: true,
        client: { select: { id: true, name: true } },
        resident: { select: { id: true, name: true } },
        /* budget: {
          select: { id: true, name: true },
        }, */
      },
    });

    if (!project) {
      throw new NotFoundException('Execution project not found');
    }

    return project as ExecutionProjectData;
  }

  /**
   * Actualiza un proyecto de ejecución
   * @param id - ID del proyecto
   * @param dto - Datos para actualizar
   * @param user - Usuario que realiza la acción
   * @returns Proyecto actualizado
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    user: UserData,
  ): Promise<HttpResponse<ExecutionProjectData>> {
    const {
      ubicationProject,
      clientId,
      residentId,
      budgetId,
      department,
      province,
      name,
      startProjectDate,
    } = updateProjectDto;

    try {
      const updatedProject = await this.prisma.$transaction(async (prisma) => {
        const project = await this.findById(id);

        if (budgetId && budgetId !== project.budget?.id) {
          await this.budgetService.validateApprovedBudget(budgetId);
        }

        if (clientId) {
          await this.client.findById(clientId);
        }

        if (residentId) {
          await this.user.findById(residentId);
        }

        const updated = await prisma.executionProject.update({
          where: { id },
          data: {
            ubicationProject,
            clientId,
            residentId,
            budgetId,
            department,
            province,
            name,
            startProjectDate,
          },
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            startProjectDate: true,
            ubicationProject: true,
            department: true,
            province: true,
            client: { select: { id: true, name: true } },
            resident: { select: { id: true, name: true } },
            /* budget: { select: { id: true, name: true } }, */
          },
        });

        await this.audit.create({
          entityId: id,
          entityType: 'executionProject',
          action: 'UPDATE',
          performedById: user.id,
          createdAt: new Date(),
        });

        return updated;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Execution project updated successfully',
        data: updatedProject as ExecutionProjectData,
      };
    } catch (error) {
      this.logger.error(
        `Error updating execution project: ${error.message}`,
        error.stack,
      );
      handleException(error, 'Error updating project');
    }
  }

  /**
   * Actualiza el estado de un proyecto de ejecución
   * @param id - ID del proyecto
   * @param dto - Nuevo estado
   * @param user - Usuario que realiza la acción
   * @returns Estado actualizado
   */
  async updateStatus(
    id: string,
    updateProjectStatusDto: UpdateProjectStatusDto,
    user: UserData,
  ): Promise<HttpResponse<ExecutionProjectStatusUpdateData>> {
    const { newStatus } = updateProjectStatusDto;

    try {
      const updatedProject = await this.prisma.$transaction(async (prisma) => {
        const project = await this.findById(id);
        const previousStatus = project.status;

        const validTransitions = {
          APPROVED: ['STARTED'],
          STARTED: ['EXECUTION'],
          EXECUTION: ['COMPLETED'],
          COMPLETED: [],
        };

        const allowedNextStates = validTransitions[project.status];

        if (!allowedNextStates.includes(newStatus)) {
          throw new BadRequestException(`Invalid status transition.`);
        }

        const updated = await prisma.executionProject.update({
          where: { id },
          data: { status: newStatus },
          select: { id: true, status: true, updatedAt: true },
        });

        await this.audit.create({
          entityId: id,
          entityType: 'executionProject',
          action: 'UPDATE',
          performedById: user.id,
          createdAt: new Date(),
        });

        return {
          id: updated.id,
          previousStatus: previousStatus,
          currentStatus: updated.status,
          updatedAt: updated.updatedAt,
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Execution project status updated successfully',
        data: updatedProject,
      };
    } catch (error) {
      this.logger.error(
        `Error updating project status: ${error.message}`,
        error.stack,
      );
      handleException(error, 'Error updating project status');
    }
  }
}
