import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateObservationDto } from './dto/create-observation.dto';
import { PrismaService } from '@prisma/prisma';
import { handleException } from '@login/login/utils';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { Observation } from '@prisma/client';
import { ProjectCharterService } from '../project-charter/project-charter.service';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { DeleteObservationsDto } from './dto/delete-observation.dto';

@Injectable()
export class ObservationsService {
  private readonly logger = new Logger(ObservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly projectCharter: ProjectCharterService,
  ) {}

  /**
   * Creates a new observation associated with a project charter
   * @param createObservationDto Data for creating the observation
   * @param user User creating the observation
   * @returns Created observation data
   */
  async create(createObservationDto: CreateObservationDto, user: UserData) {
    try {
      // Verify project charter exists
      await this.projectCharter.findById(createObservationDto.projectCharterId);

      const newObservation = await this.prisma.$transaction(async (prisma) => {
        // Create the observation
        const observation = await prisma.observation.create({
          data: {
            observation: createObservationDto.observation,
            projectCharter: {
              connect: {
                id: createObservationDto.projectCharterId,
              },
            },
          },
        });

        // Register in audit
        await this.audit.create({
          entityId: observation.id,
          entityType: 'observation',
          action: 'CREATE',
          performedById: user.id,
          createdAt: new Date(),
        });

        return observation;
      });

      return {
        statusCode: 201,
        message: 'Observation created successfully',
        data: newObservation,
      };
    } catch (error) {
      this.logger.error(
        `Error creating observation: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error creating observation');
    }
  }

  /**
   * Updates an existing observation
   * @param id Observation ID to update
   * @param updateObservationDto Data to update
   * @param user User performing the update
   * @returns Updated observation data
   */
  async update(
    id: string,
    updateObservationDto: UpdateObservationDto,
    user: UserData,
  ): Promise<HttpResponse<Observation>> {
    try {
      // Verify observation exists
      const existingObservation = await this.findById(id);

      // Validate if there are changes
      if (
        existingObservation.observation === updateObservationDto.observation
      ) {
        return {
          statusCode: 200,
          message: 'No changes required',
          data: existingObservation,
        };
      }

      const updatedObservation = await this.prisma.$transaction(
        async (prisma) => {
          // Update the observation
          const observation = await prisma.observation.update({
            where: { id },
            data: {
              observation: updateObservationDto.observation,
            },
          });

          // Register in audit
          await this.audit.create({
            entityId: observation.id,
            entityType: 'observation',
            action: 'UPDATE',
            performedById: user.id,
            createdAt: new Date(),
          });

          return observation;
        },
      );

      return {
        statusCode: 200,
        message: 'Observation updated successfully',
        data: updatedObservation,
      };
    } catch (error) {
      this.logger.error(
        `Error updating observation: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error updating observation');
    }
  }

  /**
   * Finds an observation by ID with basic validation
   * @param id Observation ID
   * @returns Found observation or throws NotFoundException
   */
  async findById(id: string): Promise<Observation> {
    const observation = await this.prisma.observation.findUnique({
      where: { id },
      include: {},
    });

    if (!observation) {
      throw new NotFoundException('Observation not found');
    }

    return observation;
  }

  /**
   * Finds one observation with complete details
   * @param id Observation ID
   * @returns Observation data or throws NotFoundException
   */
  async findOne(id: string): Promise<Observation> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error(
        `Error retrieving observation: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error retrieving observation');
    }
  }

  /**
   * Obtiene todas las observaciones
   * @param user Usuario que realiza la petición
   * @returns Lista de todas las observaciones
   */
  async findAll(): Promise<Observation[]> {
    try {
      return await this.prisma.observation.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          projectCharter: {
            select: {
              designProject: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error('Error getting all observations', error.stack);
      handleException(error, 'Error getting all observations');
    }
  }

  /**
   * Obtiene todas las observaciones asociadas a un Project Charter
   * @param projectCharterId ID del Project Charter
   * @returns Lista de observaciones del Project Charter
   */
  async findAllByProjectCharter(
    projectCharterId: string,
  ): Promise<Observation[]> {
    try {
      // Verificar que el Project Charter existe
      await this.projectCharter.findById(projectCharterId);

      const observations = await this.prisma.observation.findMany({
        where: {
          projectCharterId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          projectCharter: {
            select: {
              designProject: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!observations || observations.length === 0) {
        throw new NotFoundException(
          'No observations found for this project charter',
        );
      }

      return observations;
    } catch (error) {
      this.logger.error(
        `Error getting observations for project charter: ${projectCharterId}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error getting observations');
    }
  }

  /**
   * Elimina múltiples observaciones por sus IDs
   * @param deleteObservationsDto DTOs con los IDs de las observaciones a eliminar
   * @param user Usuario que realiza la acción
   * @returns Mensaje de confirmación
   */
  async removeAll(
    deleteObservationsDto: DeleteObservationsDto,
    user: UserData,
  ): Promise<HttpResponse<undefined>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Verificar que todas las observaciones existen
        const observationsToDelete = await prisma.observation.findMany({
          where: {
            id: {
              in: deleteObservationsDto.ids,
            },
          },
        });

        if (observationsToDelete.length !== deleteObservationsDto.ids.length) {
          throw new NotFoundException('Some observations were not found');
        }

        // Eliminar las observaciones
        await prisma.observation.deleteMany({
          where: {
            id: {
              in: deleteObservationsDto.ids,
            },
          },
        });

        // Registrar en auditoría
        const auditPromises = deleteObservationsDto.ids.map((observationId) =>
          this.audit.create({
            entityId: observationId,
            entityType: 'observation',
            action: 'DELETE',
            performedById: user.id,
            createdAt: new Date(),
          }),
        );

        await Promise.all(auditPromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Observations deleted successfully',
        data: undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting observations: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error deleting observations');
    }
  }

  /**
   * Elimina todas las observaciones asociadas a un Project Charter
   * @param projectCharterId ID del Project Charter
   * @param user Usuario que realiza la acción
   * @returns Mensaje de confirmación
   */
  async removeAllByProjectCharter(
    projectCharterId: string,
    user: UserData,
  ): Promise<HttpResponse<undefined>> {
    try {
      // Verificar que el Project Charter existe
      await this.projectCharter.findById(projectCharterId);

      await this.prisma.$transaction(async (prisma) => {
        // Obtener todas las observaciones del Project Charter
        const observations = await prisma.observation.findMany({
          where: {
            projectCharterId,
          },
          select: {
            id: true,
          },
        });

        if (observations.length === 0) {
          return {
            statusCode: HttpStatus.OK,
            message: 'No observations to delete',
            data: undefined,
          };
        }

        // Eliminar las observaciones
        await prisma.observation.deleteMany({
          where: {
            projectCharterId,
          },
        });

        // Registrar en auditoría
        const auditPromises = observations.map((observation) =>
          this.audit.create({
            entityId: observation.id,
            entityType: 'observation',
            action: 'DELETE',
            performedById: user.id,
            createdAt: new Date(),
          }),
        );

        await Promise.all(auditPromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Observations deleted successfully',
        data: undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting observations for project charter: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error deleting observations');
    }
  }
}
