import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, PrismaTransaction } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { handleException } from '@login/login/utils';
import { ProjectCharterAllData, ProjectCharterData } from '../interfaces';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class ProjectCharterService {
  private readonly logger = new Logger(ProjectCharterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async getAmountOfObservationsByProjectCharterId(
    id: string,
  ): Promise<number> {
    const observationDB = await this.prisma.observation.findMany({
      where: {
        projectCharterId: id,
      },
    });
    if (observationDB.length === 0) {
      return 0;
    }
    return observationDB.length;
  }

  /**
   * Creates a new project charter linked to a design project
   * @param designProjectId ID of the design project
   * @param prismaTransaction Prisma transaction context
   */
  async create(
    designProjectId: string,
    prismaTransaction: PrismaTransaction,
    user: UserData,
  ): Promise<void> {
    try {
      const newProjectCharter = await prismaTransaction.projectCharter.create({
        data: {
          designProject: {
            connect: {
              id: designProjectId,
            },
          },
        },
      });
      // Registrar la acción en la auditoría
      await this.audit.create({
        entityId: newProjectCharter.id,
        entityType: 'projectCharter',
        action: 'CREATE',
        performedById: user.id,
        createdAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error creating project charter for project ${designProjectId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a project charter by ID
   * @param id Project charter ID
   * @returns Project charter or throws NotFoundException
   */
  async findById(id: string): Promise<ProjectCharterData> {
    const projectCharter = await this.prisma.projectCharter.findUnique({
      where: { id },
      select: {
        id: true,
        preProjectApproval: true,
        designProject: {
          select: {
            id: true,
            code: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            designer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!projectCharter) {
      throw new NotFoundException('Project charter not found');
    }

    return projectCharter;
  }

  /**
   * Busca un project charter por ID incluyendo todas sus relaciones
   * Usa findById internamente y maneja los errores
   * @param id ID del project charter a buscar
   * @returns Project charter con sus relaciones
   * @throws {NotFoundException} Si el project charter no existe
   */
  async findOne(id: string): Promise<ProjectCharterData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error(
        `Error retrieving project charter: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error retrieving project charter');
    }
  }

  /**
   * Obtiene todos los project charters con sus relaciones
   * Los ordena por fecha de creación descendente
   * @returns Lista de project charters con sus relaciones
   * @throws {InternalServerErrorException} Si hay un error al obtener los datos
   */
  async findAll(): Promise<ProjectCharterAllData[]> {
    try {
      const projectsCharters = await this.prisma.projectCharter.findMany({
        select: {
          id: true,
          preProjectApproval: true,
          designProject: {
            select: {
              id: true,
              code: true,
              status: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
              designer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Espera todas las promesas de getAmountOfObservationsByProjectCharterId
      const projectsChartersWithObservations = await Promise.all(
        projectsCharters.map(async (projectCharter) => ({
          id: projectCharter.id,
          preProjectApproval: projectCharter.preProjectApproval,
          amountOfObservations:
            await this.getAmountOfObservationsByProjectCharterId(
              projectCharter.id,
            ),
          designProject: {
            id: projectCharter.designProject.id,
            code: projectCharter.designProject.code,
            status: projectCharter.designProject.status,
            client: {
              id: projectCharter.designProject.client.id,
              name: projectCharter.designProject.client.name,
            },
            designer: {
              id: projectCharter.designProject.designer.id,
              name: projectCharter.designProject.designer.name,
            },
          },
        })),
      );
      return projectsChartersWithObservations as ProjectCharterAllData[];
    } catch (error) {
      this.logger.error('Error getting all clients');
      handleException(error, 'Error getting all clients');
    }
  }

  /**
   * Cambia el estado de aprobación previa de un acta de proyecto
   * @param id ID del acta de proyecto
   * @param user Usuario que realiza la acción
   * @returns Respuesta HTTP con el acta de proyecto actualizada
   */
  async toggleApproved(
    id: string,
    user: UserData,
  ): Promise<HttpResponse<ProjectCharterData>> {
    try {
      const toggledProjectCharter = await this.prisma.$transaction(
        async (prisma) => {
          // Obtener la acta de proyecto actual, incluyendo todas las propiedades necesarias
          const projectCharterDB = await prisma.projectCharter.findUnique({
            where: { id },
            select: {
              id: true,
              preProjectApproval: true,
              designProject: {
                select: {
                  id: true,
                  code: true,
                  status: true,
                  client: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  designer: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });

          if (!projectCharterDB) {
            throw new BadRequestException('Project Charter not found');
          }

          // Determinar la nueva acción basada en el estado actual de preProjectApproval
          const newStatus = !projectCharterDB.preProjectApproval;
          const action = newStatus ? 'approved' : 'disapproved';

          // Actualizar el estado de preProjectApproval del acta de proyecto
          await prisma.projectCharter.update({
            where: { id },
            data: {
              preProjectApproval: newStatus,
            },
          });

          // Crear un registro de auditoría
          await prisma.audit.create({
            data: {
              entityId: projectCharterDB.id,
              action: AuditActionType.UPDATE,
              performedById: user.id,
              entityType: 'projectCharter',
            },
          });

          // Retornar la estructura de ProductData incluyendo variaciones
          const projectCharterData: ProjectCharterData = {
            id: projectCharterDB.id,
            preProjectApproval: newStatus,
            designProject: {
              id: projectCharterDB.designProject.id,
              code: projectCharterDB.designProject.code,
              status: projectCharterDB.designProject.status,
              client: {
                id: projectCharterDB.designProject.client.id,
                name: projectCharterDB.designProject.client.name,
              },
              designer: {
                id: projectCharterDB.designProject.designer.id,
                name: projectCharterDB.designProject.designer.name,
              },
            },
          };

          return { projectCharterData, action };
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: `Pre-project approval successfully ${toggledProjectCharter.action}`,
        data: toggledProjectCharter.projectCharterData,
      };
    } catch (error) {
      this.logger.error(
        `Error toggling approved for project charter with id: ${id}`,
        error.stack,
      );
      handleException(error, 'Error toggling project charter approved');
    }
  }
}
