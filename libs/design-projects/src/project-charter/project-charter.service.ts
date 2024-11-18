import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, PrismaTransaction } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { handleException } from '@login/login/utils';
import { ProjectCharter } from '@prisma/client';
import { UserData } from '@login/login/interfaces';

@Injectable()
export class ProjectCharterService {
  private readonly logger = new Logger(ProjectCharterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
  async findById(id: string): Promise<ProjectCharter> {
    const projectCharter = await this.prisma.projectCharter.findUnique({
      where: { id },
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
  async findOne(id: string): Promise<ProjectCharter> {
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
  async findAll(): Promise<ProjectCharter[]> {
    try {
      return await this.prisma.projectCharter.findMany({
        include: {
          designProject: {
            select: {
              code: true,
              name: true,
              client: {
                select: {
                  name: true,
                },
              },
            },
          },
          observations: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error('Error getting all project charters', error.stack);
      handleException(error, 'Error getting all project charters');
    }
  }
}
