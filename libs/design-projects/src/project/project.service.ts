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
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { ClientsService } from '@clients/clients';
import { UsersService } from '@login/login/admin/users/users.service';
import { handleException } from '@login/login/utils';
import { ProjectTemplate } from './project.template';
import Puppeteer from 'puppeteer';
import { BusinessService } from '@business/business';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { DesignProjectData } from '../interfaces';
import {
  DesignProjectDataNested,
  DesignProjectSummaryData,
} from '../interfaces/project.interfaces';
import { ExportProjectPdfDto } from './dto/export-project-pdf.dto';
import * as Fs from 'fs';
import * as Path from 'path';
import { QuotationsService } from '../quotations/quotations.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { DeleteChecklistDto } from './dto/delete-checklist.dto';
import { ProjectCharterService } from '../project-charter/project-charter.service';
import { DesignProjectStatus } from '@prisma/client';

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
    private readonly projectCharter: ProjectCharterService,
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
        `Cannot move to CONFIRMATION. Missing checklist`,
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
  ): Promise<HttpResponse> {
    const {
      name,
      ubicationProject,
      clientId,
      quotationId,
      designerId,
      department,
      province,
      startProjectDate,
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
            name,
            ubicationProject,
            department,
            province,
            client: { connect: { id: clientId } },
            quotation: { connect: { id: quotationId } },
            designer: { connect: { id: designer.id } },
            startProjectDate,
          },
        });

        // Crear el project charter
        await this.projectCharter.create(newProject.id, prisma);
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
        data: null,
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
  ): Promise<HttpResponse> {
    const {
      ubicationProject,
      clientId,
      designerId,
      quotationId,
      department,
      province,
      name,
      startProjectDate,
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
            startProjectDate,
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
        data: null,
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
  ): Promise<HttpResponse> {
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
            `Invalid status transition. Cannot move from ${project.status} to ${newStatus}',
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
        data: null,
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
  ): Promise<HttpResponse> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        const project = await this.findById(id);

        if (!project) {
          throw new NotFoundException(`Design project not found`);
        }

        this.validateChanges(updateChecklistDto);

        // Verificar si hay cambios en al menos uno de los campos
        const hasChanges =
          (updateChecklistDto.dateArchitectural &&
            updateChecklistDto.dateArchitectural !==
              project.dateArchitectural) ||
          (updateChecklistDto.dateStructural &&
            updateChecklistDto.dateStructural !== project.dateStructural) ||
          (updateChecklistDto.dateElectrical &&
            updateChecklistDto.dateElectrical !== project.dateElectrical) ||
          (updateChecklistDto.dateSanitary &&
            updateChecklistDto.dateSanitary !== project.dateSanitary);

        if (!hasChanges) {
          return {
            statusCode: HttpStatus.OK,
            message: 'Checklist updated successfully',
            data: null,
          };
        }

        // Actualizar el proyecto con los nuevos valores
        await prisma.designProject.update({
          where: { id },
          data: updateChecklistDto,
        });

        // Registrar en auditoría solo si hubo cambios
        if (hasChanges) {
          await this.audit.create({
            entityId: id,
            entityType: 'designProject',
            action: 'UPDATE',
            performedById: user.id,
            createdAt: new Date(),
          });
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Checklist updated successfully',
        data: null,
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
   * Borra una o más fechas del checklist de un proyecto de diseño.
   * Si alguna de las fechas a borrar ya está vacía o es nula, no se registra en la auditoría.
   *
   * @param id - ID del proyecto de diseño
   * @param deleteChecklistDto - DTO con las fechas a borrar
   * @param user - Usuario que realiza la acción
   * @returns Objeto con el resultado de la operación
   * @throws {NotFoundException} Si el proyecto de diseño no existe
   * @throws {BadRequestException} Si no se proporcionan fechas a borrar
   */
  async deleteChecklist(
    id: string,
    deleteChecklistDto: DeleteChecklistDto,
    user: UserData,
  ): Promise<HttpResponse> {
    try {
      // Validar que hay datos para actualizar
      this.validateChanges(deleteChecklistDto);

      if (deleteChecklistDto.datesToDelete.length === 0) {
        throw new BadRequestException('No dates provided to delete');
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        // Verificar que existe el proyecto
        const project = await this.findById(id);
        if (!project) {
          throw new NotFoundException('Design project not found');
        }

        // Verificar si hay cambios reales que hacer
        const hasChanges = deleteChecklistDto.datesToDelete.some(
          (dateToDelete) =>
            project[dateToDelete] !== '' && project[dateToDelete] !== null,
        );

        if (!hasChanges) {
          return {
            statusCode: HttpStatus.OK,
            message: 'No changes needed, dates were already empty',
            data: null,
          };
        }

        // Construir el objeto con los campos a actualizar
        const updateData = deleteChecklistDto.datesToDelete.reduce(
          (acc, dateField) => ({
            ...acc,
            [dateField]: '',
          }),
          {},
        );

        // Actualizar el proyecto
        await prisma.designProject.update({
          where: { id },
          data: updateData,
        });

        // Registrar en auditoría
        await this.audit.create({
          entityId: id,
          entityType: 'designProject',
          action: 'DELETE',
          performedById: user.id,
          createdAt: new Date(),
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Checklist dates deleted successfully',
          data: null,
        };
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Error deleting checklist dates for project: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error deleting project checklist dates');
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
          select: { id: true, publicCode: true },
        },
        designer: {
          select: { id: true, name: true },
        },
        dateArchitectural: true,
        dateStructural: true,
        dateElectrical: true,
        dateSanitary: true,
        startProjectDate: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Design project not found`);
    }
    return project as DesignProjectData;
  }

  /**
   * Obtiene un listado resumido de todos los proyectos de diseño.
   * Los superadmins ven todos los proyectos, los usuarios normales solo ven
   * proyectos en estados activos.
   *
   * @param user Usuario que realiza la petición
   * @returns Lista resumida de proyectos de diseño
   */
  async findAll(user: UserPayload): Promise<DesignProjectSummaryData[]> {
    try {
      // Definir estados activos
      const activeStates: DesignProjectStatus[] = [
        'APPROVED',
        'ENGINEERING',
        'CONFIRMATION',
        'PRESENTATION',
      ];

      const projects = await this.prisma.designProject.findMany({
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
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          quotation: {
            select: {
              id: true,
              publicCode: true,
            },
          },
          designer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return projects as DesignProjectSummaryData[];
    } catch (error) {
      this.logger.error('Error getting all design projects', error.stack);
      handleException(error, 'Error getting all design projects');
    }
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
        startProjectDate: true,
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
      startProjectDate: project.startProjectDate,
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

    // Cargar imágenes para la cabecera y pie de página
    let header_base64 = '';
    try {
      header_base64 = Fs.readFileSync(
        Path.join(process.cwd(), 'static', 'trazo_header_base64.txt'),
      ).toString();
    } catch (e) {
      console.error('Error loading header base 64 while rendering contract:');
      console.error(e);
    }
    let footer_base64 = '';
    try {
      footer_base64 = Fs.readFileSync(
        Path.join(process.cwd(), 'static', 'trazo_footer_base64.txt'),
      ).toString();
    } catch (e) {
      console.error('Error loading footer base 64 while rendering contract:');
      console.error(e);
    }
    let footer_der_base64 = '';
    try {
      footer_der_base64 = Fs.readFileSync(
        Path.join(process.cwd(), 'static', 'trazo_footer_der_base64.txt'),
      ).toString();
    } catch (e) {
      console.error('Error loading footer base 64 while rendering contract:');
      console.error(e);
    }

    // Generar el PDF usando Puppeteer
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(pdfHtml);

    const pdfBufferUint8Array = await page.pdf({
      format: 'A4',
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `
      <div><img style="display: inline-block; position: fixed; height: 100px; top: 40px; right: 20px;" src="data:image/png;base64,${header_base64}" /></div>
      `,
      footerTemplate: `
      <div>
<img style="display: inline-block; position: fixed; height: 325px; bottom: 40px; left: 40px;" src="data:image/png;base64,${footer_base64}" />
<img style="display: inline-block; position: fixed; height: 325px; width: 300px; bottom: 40px; right: 40px; opacity: 0.5" src="data:image/png;base64,${footer_der_base64}" />
</div>
      `,
      margin: { top: '150px', bottom: '150px' },
    });
    await browser.close();

    return new StreamableFile(pdfBufferUint8Array, {
      type: 'application/pdf',
      disposition: 'attachment; filename="generated.pdf"',
    });
  }
}
