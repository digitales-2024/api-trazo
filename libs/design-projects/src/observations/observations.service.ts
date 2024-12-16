import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { CreateObservationDto } from './dto/create-observation.dto';
import { PrismaService } from '@prisma/prisma';
import { handleException } from '@login/login/utils';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { AuditActionType } from '@prisma/client';
import { ProjectCharterService } from '../project-charter/project-charter.service';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { DeleteObservationsDto } from './dto/delete-observation.dto';
import { ProjectService } from '../project/project.service';
import { ObservationsTemplate } from './observations.template';
import * as Puppeteer from 'puppeteer';
import { ObservationData, ObservationProject } from '../interfaces';

@Injectable()
export class ObservationsService {
  private readonly logger = new Logger(ObservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly projectCharter: ProjectCharterService,
    private readonly projectService: ProjectService,
    private readonly template: ObservationsTemplate,
  ) {}

  /**
   * Creates a new observation associated with a project charter
   * @param createObservationDto Data for creating the observation
   * @param user User creating the observation
   * @returns Created observation data
   */
  async create(
    createObservationDto: CreateObservationDto,
    user: UserData,
  ): Promise<HttpResponse<ObservationData>> {
    try {
      // Verify project charter exists
      await this.projectCharter.findById(createObservationDto.projectCharterId);

      const newObservation = await this.prisma.$transaction(async (prisma) => {
        // Create the observation
        const observation = await prisma.observation.create({
          data: {
            observation: createObservationDto.observation,
            meetingDate: createObservationDto.meetingDate,
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
          action: AuditActionType.CREATE,
          performedById: user.id,
          createdAt: new Date(),
        });

        return observation;
      });

      return {
        statusCode: HttpStatus.CREATED,
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
  ): Promise<HttpResponse<ObservationData>> {
    try {
      // Verify observation exists
      const existingObservation = await this.findById(id);
      const { observation, meetingDate } = updateObservationDto;

      // Validar si hay cambios
      const noChanges =
        (observation === undefined ||
          observation === existingObservation.observation) &&
        (meetingDate === undefined ||
          meetingDate === existingObservation.meetingDate);

      if (noChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Observation updated successfully',
          data: {
            id: existingObservation.id,
            observation: existingObservation.observation,
            meetingDate: existingObservation.meetingDate,
            projectCharterId: existingObservation.projectCharterId,
          },
        };
      }

      // Construir el objeto de actualización dinámicamente solo con los campos presentes
      const updateData: any = {};
      if (
        observation !== undefined &&
        observation !== existingObservation.observation
      )
        updateData.observation = observation;
      if (
        meetingDate !== undefined &&
        meetingDate !== existingObservation.meetingDate
      )
        updateData.meetingDate = meetingDate;

      const updatedObservation = await this.prisma.$transaction(
        async (prisma) => {
          // Update the observation
          const observation = await prisma.observation.update({
            where: { id },

            data: updateData,
            select: {
              id: true,
              observation: true,
              meetingDate: true,
              projectCharterId: true,
            },
          });

          // Register in audit
          await this.audit.create({
            entityId: observation.id,
            entityType: 'observation',
            action: AuditActionType.UPDATE,
            performedById: user.id,
            createdAt: new Date(),
          });

          return observation;
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Observation updated successfully',
        data: updatedObservation,
      };
    } catch (error) {
      this.logger.error(
        `Error updating observation: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
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
  async findById(id: string): Promise<ObservationData> {
    const observation = await this.prisma.observation.findUnique({
      where: { id },
      select: {
        id: true,
        observation: true,
        meetingDate: true,
        projectCharterId: true,
      },
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
  async findOne(id: string): Promise<ObservationData> {
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
  async findAll(): Promise<ObservationProject[]> {
    try {
      return await this.prisma.observation.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          observation: true,
          meetingDate: true,
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
  ): Promise<ObservationProject[]> {
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
        select: {
          id: true,
          observation: true,
          meetingDate: true,
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

      return observations;
    } catch (error) {
      this.logger.error(
        `Error getting observations for project charter: ${projectCharterId}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
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
    deleteObservationsDto: DeleteObservationsDto,
    user: UserData,
  ): Promise<HttpResponse<undefined>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Verificar que todos los project charters existen
        const projectCharterToDelete = await prisma.projectCharter.findMany({
          where: {
            id: {
              in: deleteObservationsDto.ids,
            },
          },
        });

        if (
          projectCharterToDelete.length !== deleteObservationsDto.ids.length
        ) {
          throw new NotFoundException('Some observations were not found');
        }

        const observations = await prisma.observation.findMany({
          where: {
            projectCharterId: {
              in: deleteObservationsDto.ids,
            },
          },
        });

        // Eliminar las observaciones
        await prisma.observation.deleteMany({
          where: {
            projectCharterId: {
              in: deleteObservationsDto.ids,
            },
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

  // genera el pdf del layout
  async genPdf(id: string): Promise<StreamableFile> {
    // Get project data from id
    const project = await this.projectService.findByIdNested(id);
    if (project.projectCharters.length !== 1) {
      this.logger.warn(
        `Found a design project with 0, 2 or more charters. Project id ${project.id}, charters: ${project.projectCharters}`,
      );
      throw new BadRequestException('Error fetching charters for this project');
    }
    const charterId = project.projectCharters[0].id;
    const observations = await this.findAllByProjectCharter(charterId);

    const pdfHtml = await this.template.render(project, observations);

    // Generar el PDF usando Puppeteer
    const browser = await Puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(pdfHtml);

    // The size of the page in px, before accounting for the pdf margin
    const pageBody = await page.$('body');
    const boundingBox = await pageBody.boundingBox();
    const pageHeight = boundingBox.height;
    const pageHeightMilli = pageHeight * 0.2645833333;

    // A4 paper is 297mm in heigth. The PDF has 5mm margin top & bottom.
    // So we count the number of pages as its height / 287mm
    const numberOfPages = Math.ceil(pageHeightMilli / 287);

    // Replace this value in the html
    const newPageHtml = pdfHtml.replace(
      '{{pageCount}}',
      numberOfPages.toString(),
    );
    // Set the page with the number of pages
    await page.setContent(newPageHtml);

    const pdfBufferUint8Array = await page.pdf({
      format: 'A4',
      preferCSSPageSize: true,
      margin: { top: '50px', bottom: '50px' },
    });
    await browser.close();

    return new StreamableFile(pdfBufferUint8Array, {
      type: 'application/pdf',
      disposition: 'attachment; filename="acta-de-proyecto-gen.pdf"',
    });
  }

  // métodos para generar el contrato como PDF
  async genPdfLayout(id: string): Promise<string> {
    // Get project data from id
    const project = await this.projectService.findByIdNested(id);
    if (project.projectCharters.length !== 1) {
      this.logger.warn(
        `Found a design project with 0, 2 or more charters. Project id ${project.id}, charters: ${project.projectCharters}`,
      );
      throw new BadRequestException('Error fetching charters for this project');
    }
    const charterId = project.projectCharters[0].id;
    const observations = await this.findAllByProjectCharter(charterId);

    return await this.template.render(project, observations);
  }
}
