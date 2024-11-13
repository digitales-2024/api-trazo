import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateObservationDto } from './dto/create-observation.dto';
import { PrismaService } from '@prisma/prisma';
import { handleException } from '@login/login/utils';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { Observation } from '@prisma/client';
import { ProjectCharterService } from '../project-charter/project-charter.service';
import { UpdateObservationDto } from './dto/update-observation.dto';

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
}
