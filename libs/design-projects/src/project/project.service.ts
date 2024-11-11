import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { UserData } from '@login/login/interfaces';
import { ClientsService } from '@clients/clients';
import { UsersService } from '@login/login/admin/users/users.service';
import { handleException } from '@login/login/utils';
import { ProjectTemplate } from './project.template';
import Puppeteer from 'puppeteer';
import { BusinessService } from '@business/business';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { DesignProjectData } from '../interfaces';
import { DesignProjectDataNested } from '../interfaces/project.interface';
import { ExportProjectPdfDto } from './dto/export-project-pdf.dto';
import { QuotationsService } from '../quotations/quotations.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

/**
 * Servicio para gestionar proyectos de diseño
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly client: ClientsService,
    private readonly user: UsersService,
    private readonly businessService: BusinessService,
    private readonly template: ProjectTemplate,
    private readonly quotation: QuotationsService,
  ) {}

  /**
   * Genera un código único para un nuevo proyecto de diseño con el formato PRY-DIS-XXX
   * @returns Código generado para el proyecto
   */
  private async generateCodeProjectDesing(): Promise<string> {
    // Generar el siguiente código incremental
    const lastProject = await this.prisma.designProject.findFirst({
      where: { code: { startsWith: 'PRY-DIS-' } },
      orderBy: { code: 'desc' }, // Orden descendente
    });

    const lastIncrement = lastProject
      ? parseInt(lastProject.code.split('-')[2], 10)
      : 0;
    const projectCode = `PRY-DIS-${String(lastIncrement + 1).padStart(3, '0')}`;
    return projectCode;
  }
  /**
   * Valida si un proyecto puede pasar al estado ENGINEERING
   * @param project - Proyecto a validar
   * @throws {BadRequestException} Si no cumple los requisitos
   */
  private async canMoveToEngineering(
    project: DesignProjectData,
  ): Promise<void> {
    if (project.status !== 'APPROVED') {
      throw new BadRequestException(
        'Project must be in APPROVED status to move to ENGINEERING',
      );
    }
    // Aquí podrías agregar más validaciones específicas para ENGINEERING
  }

  /**
   * Valida si un proyecto puede pasar al estado CONFIRMATION
   * @param project - Proyecto a validar
   * @throws {BadRequestException} Si no cumple los requisitos
   */
  private async canMoveToConfirmation(
    project: DesignProjectData,
  ): Promise<void> {
    // Validar estado correcto
    if (project.status !== 'ENGINEERING') {
      throw new BadRequestException(
        'Project must be in ENGINEERING status to move to CONFIRMATION',
      );
    }

    // Validar fechas requeridas
    await this.validateDatesForConfirmation(project);

    // Aquí podrías agregar más validaciones en el futuro
  }

  /**
   * Valida si un proyecto puede pasar al estado PRESENTATION
   * @param project - Proyecto a validar
   * @throws {BadRequestException} Si no cumple los requisitos
   */
  private async canMoveToPresentation(
    project: DesignProjectData,
  ): Promise<void> {
    if (project.status !== 'CONFIRMATION') {
      throw new BadRequestException(
        'Project must be in CONFIRMATION status to move to PRESENTATION',
      );
    }
    // Futuras validaciones para PRESENTATION
  }

  /**
   * Valida si un proyecto puede pasar al estado COMPLETED
   * @param project - Proyecto a validar
   * @throws {BadRequestException} Si no cumple los requisitos
   */
  private async canMoveToCompleted(project: DesignProjectData): Promise<void> {
    if (project.status !== 'PRESENTATION') {
      throw new BadRequestException(
        'Project must be in PRESENTATION status to move to COMPLETED',
      );
    }
    // Futuras validaciones para COMPLETED
  }

  /**
   * Valida que todas las fechas requeridas estén definidas para el proyecto
   * @param project - Proyecto a validar
   * @throws {BadRequestException} Si faltan fechas requeridas
   */
  private validateDatesForConfirmation(project: DesignProjectData): void {
    const missingDates = [];

    if (!project.dateArchitectural) missingDates.push('dateArchitectural');
    if (!project.dateStructural) missingDates.push('dateStructural');
    if (!project.dateElectrical) missingDates.push('dateElectrical');
    if (!project.dateSanitary) missingDates.push('dateSanitary');

    if (missingDates.length > 0) {
      throw new BadRequestException(
        `Cannot move to CONFIRMATION. Missing dates: ${missingDates.join(', ')}`,
      );
    }
  }

  /**
   * Valida que no exista otro proyecto de diseño con la cotización especificada
   * @param quotationId ID de la cotización a validar
   * @param projectId ID del proyecto actual (opcional, para validación en updates)
   * @throws BadRequestException si ya existe un proyecto con esa cotización
   */
  private async validateUniqueQuotation(
    quotationId: string,
    projectId?: string,
  ): Promise<void> {
    const existingProject = await this.prisma.designProject.findFirst({
      where: {
        quotationId,
        ...(projectId && {
          NOT: {
            id: projectId, // Excluir el proyecto actual en caso de update
          },
        }),
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (existingProject) {
      throw new BadRequestException(
        `A design project already exists for this quotation`,
      );
    }
  }

  /**
   * Valida si un DTO tiene cambios significativos para actualizar
   * @param dto DTO a validar
   * @throws BadRequestException si no hay cambios o el DTO está vacío
   */
  private validateChanges<T extends object>(dto: T): void {
    // Verifica si el DTO es null o undefined
    if (!dto) {
      throw new BadRequestException('No data provided for update');
    }

    // Verifica si el DTO es un objeto vacío
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Update data is empty');
    }

    // Verifica si todos los campos son undefined o null
    const hasValidValues = Object.values(dto).some(
      (value) => value !== undefined && value !== null,
    );

    if (!hasValidValues) {
      throw new BadRequestException('No valid values provided for update');
    }
  }

  /**
   * Crea un nuevo proyecto de diseño
   * @param createDesignProjectDto - Datos del nuevo proyecto
   * @param user - Usuario que realiza la acción
   * @throws {NotFoundException} Si el cliente, cotización o diseñador no existen
   * @throws {BadRequestException} Si la cotización no está aprobada
   */
  async create(
    createDesignProjectDto: CreateProjectDto,
    user: UserData,
  ): Promise<{ statusCode: number; message: string }> {
    const {
      name,
      meetings,
      ubicationProject,
      clientId,
      quotationId,
      designerId,
      department,
      province,
    } = createDesignProjectDto;

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Validar que el cliente existe
        await this.client.findById(clientId);

        // Validar que la cotización existe y está aprobada
        await this.quotation.validateApprovedQuotation(quotationId, user);

        await this.validateUniqueQuotation(quotationId);

        // Validar que el diseñador existe
        const designer = await this.user.findById(designerId);

        const projectCode = await this.generateCodeProjectDesing();

        // Crear el proyecto
        const newProject = await prisma.designProject.create({
          data: {
            code: projectCode,
            name: name,
            meetings,
            ubicationProject,
            department,
            province,
            client: { connect: { id: clientId } },
            quotation: { connect: { id: quotationId } },
            designer: { connect: { id: designer.id } },
          },
        });

        // Registrar la acción en la auditoría
        await this.audit.create({
          entityId: newProject.id,
          entityType: 'designProject',
          action: 'CREATE',
          performedById: user.id,
          createdAt: new Date(),
        });
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Design Project created successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error creating design project: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating design project');
    }
  }
  /**
   * Actualiza los datos de un proyecto
   * @param id - ID del proyecto a actualizar
   * @param updateProjectDto - Datos a actualizar
   * @param user - Usuario que realiza la acción
   * @throws {NotFoundException} Si el proyecto no existe
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    user: UserData,
  ): Promise<{ statusCode: number; message: string }> {
    const {
      ubicationProject,
      clientId,
      designerId,
      quotationId,
      department,
      province,
      name,
    } = updateProjectDto;

    try {
      await this.prisma.$transaction(async (prisma) => {
        this.validateChanges(updateProjectDto);

        const project = await this.findById(id);

        if (clientId && clientId !== project.client.id) {
          await this.client.findById(clientId);
        }

        if (designerId && designerId !== project.designer.id) {
          await this.user.findById(designerId);
        }

        // Si se está actualizando el quotationId
        if (updateProjectDto.quotationId) {
          // Validar que la cotización existe y está aprobada
          await this.quotation.validateApprovedQuotation(
            updateProjectDto.quotationId,
            user,
          );

          // Validar que no existe otro proyecto con esta cotización
          await this.validateUniqueQuotation(updateProjectDto.quotationId, id);
        }

        await prisma.designProject.update({
          where: { id },
          data: {
            ubicationProject,
            clientId,
            designerId,
            quotationId,
            department,
            province,
            name,
          },
        });

        await this.audit.create({
          entityId: id,
          entityType: 'designProject',
          action: 'UPDATE',
          performedById: user.id,
          createdAt: new Date(),
        });
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Design project updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error updating project: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating project');
    }
  }
  /**
   * Actualiza el estado del proyecto según las transiciones permitidas
   * @param id - ID del proyecto
   * @param updateProjectStatusDto - Nuevo estado a actualizar
   * @param user - Usuario que realiza la acción
   * @throws {BadRequestException} Si la transición no es válida
   * @throws {NotFoundException} Si el proyecto no existe
   */
  async updateStatus(
    id: string,
    updateProjectStatusDto: UpdateProjectStatusDto,
    user: UserData,
  ): Promise<{ statusCode: number; message: string }> {
    const { newStatus } = updateProjectStatusDto;

    try {
      await this.prisma.$transaction(async (prisma) => {
        const project = await this.findById(id);

        this.validateChanges(updateProjectStatusDto);

        if (project.status === newStatus) {
          return; // No es necesario actualizar
        }

        // Validar transiciones permitidas
        const validTransitions = {
          APPROVED: ['ENGINEERING'],
          ENGINEERING: ['CONFIRMATION'],
          CONFIRMATION: ['PRESENTATION'],
          PRESENTATION: ['COMPLETED'],
          COMPLETED: [],
        };

        // Obtener las transiciones permitidas para el estado actual
        const allowedNextStates = validTransitions[project.status];

        // Verificar si la transición es válida
        if (!allowedNextStates.includes(newStatus)) {
          throw new BadRequestException(
            `Invalid status transition. Cannot move from ${project.status} to ${newStatus}. Allowed transitions: ${allowedNextStates.join(
              ', ',
            )}`,
          );
        }
        // Validar la transición según el nuevo estado
        switch (newStatus) {
          case 'ENGINEERING':
            await this.canMoveToEngineering(project);
            break;

          case 'CONFIRMATION':
            await this.canMoveToConfirmation(project);
            break;

          case 'PRESENTATION':
            await this.canMoveToPresentation(project);
            break;

          case 'COMPLETED':
            await this.canMoveToCompleted(project);
            break;

          default:
            throw new BadRequestException(`Invalid status: ${newStatus}`);
        }

        // Actualizar estado
        await prisma.designProject.update({
          where: { id },
          data: { status: newStatus },
        });

        // Registrar en auditoría
        await this.audit.create({
          entityId: id,
          entityType: 'designProject',
          action: 'UPDATE',
          performedById: user.id,
          createdAt: new Date(),
        });
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Design project status updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error updating project status: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating project status');
    }
  }
  /**
   * Actualiza las fechas del checklist de un proyecto
   * @param id - ID del proyecto
   * @param updateChecklistDto - Fechas a actualizar
   * @param user - Usuario que realiza la acción
   * @throws {NotFoundException} Si el proyecto no existe
   */
  async updateChecklist(
    id: string,
    updateChecklistDto: UpdateChecklistDto,
    user: UserData,
  ): Promise<{ statusCode: number; message: string }> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        this.validateChanges(updateChecklistDto);

        const project = await this.findById(id);

        if (!project) {
          throw new NotFoundException(`Design project not found`);
        }

        // Validar cambios usando la nueva función

        await prisma.designProject.update({
          where: { id },
          data: updateChecklistDto,
        });

        await this.audit.create({
          entityId: id,
          entityType: 'designProject',
          action: 'UPDATE',
          performedById: user.id,
          createdAt: new Date(),
        });
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Checklist updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error updating checklist for project: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating project checklist');
    }
  }
  /**
   * Busca un proyecto de diseño por ID
   * @param id - ID del proyecto
   * @returns Promise con los datos del proyecto
   * @throws {NotFoundException} Si el proyecto no existe
   */
  async findOne(id: string): Promise<DesignProjectData> {
    try {
      return await this.findById(id);
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

      handleException(error, 'Error retrieving project ');
    }
  }
  /**
   * Obtiene información básica de un proyecto por ID
   * @param id - ID del proyecto
   * @returns Promise con los datos básicos del proyecto
   * @throws {NotFoundException} Si el proyecto no existe
   */
  async findById(id: string): Promise<DesignProjectData> {
    const project = await this.prisma.designProject.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        ubicationProject: true,
        department: true,
        province: true,
        status: true,
        client: {
          select: { id: true, name: true },
        },
        quotation: {
          select: { id: true, code: true },
        },
        designer: {
          select: { id: true, name: true },
        },
        dateArchitectural: true,
        dateStructural: true,
        dateElectrical: true,
        dateSanitary: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Design project not found`);
    }
    return project as DesignProjectData;
  }

  /**
   * Gets the project, quotation, levels and spaces by id.
   * Used by the PDF renderer only
   */
  private async findByIdNested(id: string): Promise<DesignProjectDataNested> {
    const project = await this.prisma.designProject.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        ubicationProject: true,
        department: true,
        province: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true,
            address: true,
            province: true,
            department: true,
            rucDni: true,
          },
        },
        quotation: {
          select: {
            id: true,
            code: true,
            name: true,
            publicCode: true,
            description: true,
            status: true,
            discount: true,
            totalAmount: true,
            deliveryTime: true,
            exchangeRate: true,
            landArea: true,
            paymentSchedule: true,
            integratedProjectDetails: true,
            architecturalCost: true,
            structuralCost: true,
            electricCost: true,
            sanitaryCost: true,
            metering: true,
            createdAt: true,
            levels: {
              select: {
                id: true,
                name: true,
                LevelsOnSpaces: {
                  select: {
                    id: true,
                    amount: true,
                    area: true,
                    space: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        designer: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Design project not found`);
    }

    const quotation = project.quotation;
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      ubicationProject: project.ubicationProject,
      department: project.department,
      province: project.province,
      status: project.status,
      quotation: {
        id: quotation.id,
        name: quotation.name,
        code: quotation.code,
        publicCode: quotation.publicCode,
        description: quotation.description,
        status: quotation.status,
        discount: quotation.discount,
        totalAmount: quotation.totalAmount,
        deliveryTime: quotation.deliveryTime,
        exchangeRate: quotation.exchangeRate,
        landArea: quotation.landArea,
        paymentSchedule: quotation.paymentSchedule,
        integratedProjectDetails: quotation.integratedProjectDetails,
        architecturalCost: quotation.architecturalCost,
        structuralCost: quotation.structuralCost,
        electricCost: quotation.electricCost,
        sanitaryCost: quotation.sanitaryCost,
        metering: quotation.metering,
        levels: quotation.levels.map((level) => ({
          id: level.id,
          name: level.name,
          spaces: level.LevelsOnSpaces.map((space) => ({
            id: space.id,
            name: space.space.name,
            amount: space.amount,
            area: space.area,
          })),
        })),
      },
      designer: project.designer,
      client: project.client,
    };
  }

  // métodos para generar el contrato como PDF
  async genPdfLayout(id: string): Promise<string> {
    // Get the data
    const allData = await this.findByIdNested(id);
    const business = await this.businessService.findAll();

    return await this.template.renderContract(
      allData,
      business[0],
      new Date('2024-10-12'),
    );
  }

  async findOnePdf(
    id: string,
    dto: ExportProjectPdfDto,
  ): Promise<StreamableFile> {
    // Get the data
    const allData = await this.findByIdNested(id);
    const business = await this.businessService.findAll();

    // Render the quotation into HTML
    const pdfHtml = await this.template.renderContract(
      allData,
      business[0],
      new Date(dto.signingDate),
    );

    // Generar el PDF usando Puppeteer
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(pdfHtml);

    const pdfBufferUint8Array = await page.pdf({
      format: 'A4',
      preferCSSPageSize: true,
    });
    await browser.close();

    return new StreamableFile(pdfBufferUint8Array, {
      type: 'application/pdf',
      disposition: 'attachment; filename="cotizacion_demo_2.pdf"',
    });
  }
}
