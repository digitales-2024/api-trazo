import { BudgetService } from './../budget/budget.service';
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
import { CreateExecutionProjectDto } from './dto/create-execution-project.dto';
import { UpdateExecutionProjectDto } from './dto/update-execution-project.dto';
import { UpdateExecutionProjectStatusDto } from './dto/update-execution-project-status.dto';
import { DeleteExecutionProjectDto } from './dto/delete-execution-project.dto';
import {
  ExecutionProjectData,
  ExecutionProjectSummaryData,
  ExecutionProjectStatusUpdateData,
} from '../interfaces/executionProject.interface';
import { ExecutionProjectStatus } from '@prisma/client';
import { handleException } from '@login/login/utils';

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
    createExecutionProjectDto: CreateExecutionProjectDto,
    user: UserData,
  ): Promise<HttpResponse<ExecutionProjectData>> {
    const {
      name,
      ubicationProject,
      clientId,
      residentId,
      budgetId,
      department,
      province,
      startProjectDate,
      executionTime,
    } = createExecutionProjectDto;
    let newProject;

    // Verificar si el presupuesto ya esta asociado a otro proyecto
    const existingBudget = await this.prisma.executionProject.findUnique({
      where: { budgetId },
    });

    if (existingBudget) {
      throw new BadRequestException(
        'This budget is alredy assocciated with the another execution project',
      );
    }

    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      select: { status: true },
    });

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Validando que el cliente existe
        await this.client.findById(clientId);

        // Validando que el residente existe
        await this.user.findById(residentId);

        // Validando que el presupuesto existe
        await this.budgetService.findById(budgetId);

        // Verificando que el estado del Presupuesto sea "Aprobado"
        if (budget.status !== 'APPROVED') {
          throw new BadRequestException('This budget is not approved');
        }

        const projectCode = await this.generateCodeProjectExecution();

        await this.client.findById(clientId);
        await this.user.findById(residentId);

        newProject = await prisma.executionProject.create({
          data: {
            code: projectCode,
            name,
            ubicationProject,
            department,
            province,
            startProjectDate,
            executionTime,
            client: { connect: { id: clientId } },
            resident: { connect: { id: residentId } },
            budget: { connect: { id: budgetId } },
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
            executionTime: true,
            client: { select: { id: true, name: true } },
            resident: { select: { id: true, name: true } },
            budget: { select: { id: true, name: true } },
          },
        });

        // Registrar la auditoría de la creación del proyecto
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
        data: newProject,
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
    try {
      return this.findById(id);
    } catch (error) {
      this.logger.error(
        `Error retrieving project: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error retrieving project');
    }
  }

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
        executionTime: true,
        client: { select: { id: true, name: true } },
        resident: { select: { id: true, name: true } },
        budget: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Execution project not found');
    }

    return project as unknown as ExecutionProjectData;
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
    updateProjectDto: UpdateExecutionProjectDto,
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
      executionTime,
    } = updateProjectDto;

    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      select: { status: true },
    });

    try {
      const updatedProject = await this.prisma.$transaction(async (prisma) => {
        // Verificar que el proyecto existe
        const project = await this.findById(id);
        if (!project) {
          throw new NotFoundException('Execution project with id id not found');
        }

        // Verificar si el cliente existe
        if (clientId) {
          await this.client.findById(clientId);
        }

        // Verificar si el residente existe
        if (residentId) {
          await this.user.findById(residentId);
        }

        if (budgetId && budgetId !== project.budget.id) {
          await this.budgetService.validateApprovedBudget(budgetId);
        }

        // Verificando que el estado del Presupuesto sea "Aprobado"
        if (budget && budget.status !== 'APPROVED') {
          throw new BadRequestException('This budget is not approved');
        }

        if (budgetId) {
          await this.budgetService.findById(budgetId);
        }

        // Validando que el presupuesto existe
        await this.budgetService.findById(budgetId);

        // Validando si hay cambios
        const changes =
          (clientId === undefined || clientId === project.client.id) &&
          (ubicationProject === undefined ||
            ubicationProject === project.ubicationProject) &&
          (residentId === undefined || residentId === project.resident.id) &&
          (budgetId === undefined || budgetId === project.budget.id) &&
          (department === undefined || department === project.department) &&
          (province === undefined || province === project.province) &&
          (name === undefined || name === project.name) &&
          (startProjectDate === undefined ||
            startProjectDate === project.startProjectDate) &&
          (executionTime === undefined ||
            executionTime === project.executionTime);

        if (changes) {
          return project;
        }

        // Construyendo el objeto de actualización
        const updateData: any = {};

        if (clientId !== undefined && clientId !== project.client.id)
          updateData.clientId = clientId;
        if (
          ubicationProject !== undefined &&
          ubicationProject !== project.ubicationProject
        )
          updateData.ubicationProject = ubicationProject;
        if (residentId !== undefined && residentId !== project.resident.id)
          updateData.residentId = residentId;
        if (budgetId !== undefined && budgetId !== project.budget?.[0]?.id)
          updateData.budgetId = budgetId;
        if (department !== undefined && department !== project.department)
          updateData.department = department;
        if (province !== undefined && province !== project.province)
          updateData.province = province;
        if (name !== undefined && name !== project.name) updateData.name = name;
        if (
          startProjectDate !== undefined &&
          startProjectDate !== project.startProjectDate
        )
          updateData.startProjectDate = startProjectDate;
        if (
          executionTime !== undefined &&
          executionTime !== project.executionTime
        )
          updateData.executionTime = executionTime;

        // Actualizar el proyecto de ejecución
        const updated = await prisma.executionProject.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            startProjectDate: true,
            ubicationProject: true,
            department: true,
            province: true,
            executionTime: true,
            client: { select: { id: true, name: true } },
            resident: { select: { id: true, name: true } },
            budget: { select: { id: true, name: true } },
          },
        });

        // Creando el registro en la auditoria
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
        data: updatedProject as unknown as ExecutionProjectData,
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
    updateProjectStatusDto: UpdateExecutionProjectStatusDto,
    user: UserData,
  ): Promise<HttpResponse<ExecutionProjectStatusUpdateData>> {
    const { newStatus } = updateProjectStatusDto;

    try {
      const updatedProject = await this.prisma.$transaction(async (prisma) => {
        const project = await this.findById(id);
        const previousStatus = project.status;

        const updated = await prisma.executionProject.update({
          where: { id },
          data: { status: newStatus },
          select: { id: true, status: true, updatedAt: true },
        });

        const notChanges =
          newStatus === undefined || newStatus === previousStatus;

        if (notChanges) {
          return {
            id: updated.id,
            previousStatus: previousStatus,
            currentStatus: updated.status,
            updatedAt: updated.updatedAt,
          };
        }

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

  /**
   * Elimina uno o más proyectos de ejecución permanentemente de la base de datos.
   * Si algún proyecto no existe, se lanza una excepción.
   *
   * @param deleteProjectsDto - DTO con los IDs de los proyectos a borrar
   * @param user - Usuario que realiza la acción
   * @returns Objeto con el resultado de la operación
   * @throws {NotFoundException} Si no se encuentran proyectos con los IDs proporcionados
   */
  async remove(
    deleteProjectsDto: DeleteExecutionProjectDto,
    user: UserData,
  ): Promise<HttpResponse> {
    try {
      // Validar que se proporcionen IDs
      if (deleteProjectsDto.ids.length === 0) {
        throw new BadRequestException('No project IDs provided to delete');
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        // Buscar proyectos que existen
        const projects = await prisma.executionProject.findMany({
          where: {
            id: { in: deleteProjectsDto.ids },
          },
          select: {
            id: true,
            name: true,
            status: true,
          },
        });

        const invalidProjects = projects.filter(
          (project) => !['STARTED', 'CANCELLED'].includes(project.status),
        );

        if (projects.length !== deleteProjectsDto.ids.length) {
          throw new NotFoundException(
            'Projects were not found. Ensure all IDs are valid.',
          );
        }

        if (invalidProjects.length > 0) {
          throw new NotFoundException(
            'You cannot delete projects in execution or completed status',
          );
        }

        // Eliminar proyectos
        await prisma.executionProject.deleteMany({
          where: {
            id: { in: deleteProjectsDto.ids },
          },
        });

        // Registrar auditoría para cada eliminación
        const auditPromises = projects.map((project) =>
          prisma.audit.create({
            data: {
              entityId: project.id,
              entityType: 'executionProject',
              action: 'DELETE',
              performedById: user.id,
              createdAt: new Date(),
            },
          }),
        );

        await Promise.all(auditPromises);

        return {
          statusCode: HttpStatus.OK,
          message: 'Execution projects deleted successfully',
          data: null,
        };
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error deleting execution projects: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error deleting execution projects');
    }
  }
}
