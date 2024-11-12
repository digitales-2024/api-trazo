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
import { DesignProjectDataNested } from '../interfaces/project.interfaces';
import { ExportProjectPdfDto } from './dto/export-project-pdf.dto';
import * as Fs from 'fs';
import * as Path from 'path';

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
  ) {}

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
   * Crea un nuevo proyecto de diseño.
   * @param createDesignProjectDto DTO con los datos del proyecto.
   * @param user Usuario que realiza la acción.
   */
  async create(
    createDesignProjectDto: CreateProjectDto,
    user: UserData,
  ): Promise<{ statusCode: number; message: string }> {
    const {
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

        // Validar que la cotización existe
        const quotation = await prisma.quotation.findUnique({
          where: { id: quotationId },
        });
        if (!quotation) {
          throw new NotFoundException(`Quotation not found`);
        }
        if (quotation.status === 'PENDING' || quotation.status === 'REJECTED') {
          throw new NotFoundException(`Verify quotation status`);
        }

        // Validar que el diseñador existe
        const designer = await this.user.findById(designerId);

        const projectCode = await this.generateCodeProjectDesing();

        // Crear el proyecto
        const newProject = await prisma.designProject.create({
          data: {
            code: projectCode,
            name: quotation.name,
            meetings: meetings, // Parsear JSON de reuniones
            ubicationProject,
            department,
            province,
            client: { connect: { id: clientId } },
            quotation: { connect: { id: quotation.id } },
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

      handleException(error, 'Error creating a client');
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Design Project created successfully',
    };
  }

  async updateStatus(
    id: string,
    updateProjectStatusDto: UpdateProjectStatusDto,
    user: UserData,
  ): Promise<{ statusCode: number; message: string }> {
    const { newStatus } = updateProjectStatusDto;

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Verificar si el proyecto existe
        const project = await this.findById(id);

        if (project.status === newStatus) {
          return; // No es necesario actualizar
        }

        // Actualiza estado

        await prisma.designProject.update({
          where: { id },
          data: { status: newStatus },
        });

        await this.audit.create({
          entityId: id,
          entityType: 'designProject',
          action: 'UPDATE',
          performedById: user.id,
          createdAt: new Date(),
        });
      });
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

      handleException(error, 'Error updating project status');
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Design project status update successfully',
    };
  }

  async findOne(id: string): Promise<DesignProjectData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error(
        `Error retrieving project with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error retrieving project by ID');
    }
  }

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
