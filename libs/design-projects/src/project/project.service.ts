import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { UserData } from '@login/login/interfaces';
import { ClientsService } from '@clients/clients';
import { UsersService } from '@login/login/admin/users/users.service';
import { handleException } from '@login/login/utils';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly client: ClientsService,
    private readonly user: UsersService,
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
    const { meetings, ubicationProject, clientId, quotationId, designerId } =
      createDesignProjectDto;

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
            meetings: JSON.parse(meetings), // Parsear JSON de reuniones
            ubicationProject,
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
}