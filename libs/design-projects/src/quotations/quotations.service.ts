import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-status.dto';
import { AuditActionType, QuotationStatusType } from '@prisma/client';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { ClientsService } from '@clients/clients';
import { DeleteQuotationsDto } from './dto/delete-quotation.dto';
import { handleException } from '@login/login/utils';
import {
  QuotationDataNested,
  QuotationSummaryData,
} from '@clients/clients/interfaces/quotation.interface';
import * as Puppeteer from 'puppeteer';
import { QuotationTemplate } from './quotations.template';

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly clientService: ClientsService,
    private readonly template: QuotationTemplate,
  ) {}

  /**
   * Crea una cotizacion y todos sus datos asociados.
   * Recibe los datos de la cotizacion, niveles y ambientes.
   * Los crea según el orden necesario, asignando ids correctos
   *
   * @param createQuotationDto datos con los que crear la cotizacion
   * @param user usuario que realiza la accion
   */
  async create(
    createQuotationDto: CreateQuotationDto,
    user: UserData,
  ): Promise<HttpResponse<undefined>> {
    const {
      name,
      code,
      description,
      clientId,
      discount,
      deliveryTime,
      exchangeRate,
      landArea,
      paymentSchedule,
      integratedProjectDetails,
      architecturalCost,
      structuralCost,
      electricCost,
      sanitaryCost,
      metering,
      levels,
      totalAmount,
    } = createQuotationDto;

    await this.prisma.$transaction(async (prisma) => {
      // get client via their services
      const client = await this.clientService.findById(clientId);

      // validate that all the spaceIds exist
      // get all spaceids
      const spaceIdsRepeated = levels.flatMap((level) =>
        level.spaces.map((space) => space.spaceId),
      );
      const spaceIds = [...new Set(spaceIdsRepeated)];
      // test database
      const spacesDb = await prisma.spaces.findMany({
        where: {
          id: {
            in: spaceIds,
          },
        },
        select: {
          id: true,
        },
      });
      if (spacesDb.length !== spaceIds.length) {
        this.logger.error(
          `create: attempted to create with an invalid spaceId`,
        );
        throw new NotFoundException('Space not found');
      }

      // create the quotation along with its associated levels
      const newQuotation = await prisma.quotation.create({
        data: {
          name,
          code,
          description,
          // tabla client
          client: {
            connect: {
              id: client.id,
            },
          },
          totalAmount,
          discount,
          deliveryTime,
          exchangeRate,
          landArea,
          paymentSchedule,
          integratedProjectDetails,
          architecturalCost,
          structuralCost,
          electricCost,
          sanitaryCost,
          metering,
          levels: {
            create: levels.map((levelsObj) => ({
              name: levelsObj.name,
            })),
          },
        },
        select: {
          id: true,
          levels: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // if there are levels, create and link their LevelsToSpaces
      if (levels.length > 0) {
        // ensure no 2 levels have the same name.
        // search for any duplicate
        const duplicateIdx = {};
        for (const level of levels) {
          if (duplicateIdx[level.name] !== undefined) {
            // duplicate found - throw error
            this.logger.error(
              `create: tried to create two levels with the same name: ${level.name}`,
            );
            throw new BadRequestException('Error creating quotation');
          }
          duplicateIdx[level.name] = true;
        }

        // create a list of LevelsToSpaces to create
        const levelsToSpaces = [];
        const storedLevels = newQuotation.levels;

        for (const level of levels) {
          const levelStored = storedLevels.find((l) => l.name === level.name);
          if (levelStored === undefined) {
            this.logger.error(
              `create: a quotation ${newQuotation.id} child level with name ${level.name} was not found`,
            );
            throw new InternalServerErrorException('Error creating quotation');
          }
          const levelId = levelStored.id;

          for (const space of level.spaces) {
            levelsToSpaces.push({
              amount: space.amount,
              area: space.area,
              levelId,
              spaceId: space.spaceId,
            });
          }
        }

        // create those
        await prisma.levelsOnSpaces.createMany({
          data: levelsToSpaces,
        });

        // get the ids of the levelsOnSpaces just created
        const levelsOnSpacesIds = await prisma.levelsOnSpaces.findMany({
          where: {
            levelId: {
              in: storedLevels.map((l) => l.id),
            },
          },
          select: { id: true },
        });

        // insert those in the audit db
        const now = new Date();
        await prisma.audit.createMany({
          data: levelsOnSpacesIds.map((l) => ({
            entityId: l.id,
            entityType: 'levelsOnSpaces',
            action: AuditActionType.CREATE,
            performedById: user.id,
            createdAt: now,
          })),
        });

        // continue
      }

      // collect all levels created
      const now = new Date();
      const levelsAudits = newQuotation.levels.map((level) => ({
        entityId: level.id,
        entityType: 'level',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: now,
      }));

      // Registar creacion de la cotizacion y sus niveles
      await prisma.audit.createMany({
        data: [
          {
            entityId: newQuotation.id,
            entityType: 'quotation',
            action: AuditActionType.CREATE,
            performedById: user.id,
            createdAt: new Date(),
          },
          ...levelsAudits,
        ],
      });
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Quotation created',
      data: undefined,
    };
  }

  /**
   * Obtener todas las cotizaciones, sus niveles y sus ambientes.
   * Incluye las cotizaciones REJECTED solo si el usuario es un superadmin
   *
   * @param user usuario que realiza la peticion
   * @returns Todas las cotizaciones
   */
  async findAll(user: UserPayload): Promise<QuotationSummaryData[]> {
    try {
      const quotations = await this.prisma.quotation.findMany({
        where: {
          ...(user.isSuperAdmin
            ? {}
            : {
                status: {
                  in: [
                    QuotationStatusType.PENDING,
                    QuotationStatusType.APPROVED,
                  ],
                },
              }), // Filtrar por status solo si no es super admin
        },
        select: {
          id: true,
          name: true,
          status: true,
          totalAmount: true,
          metering: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo QuotationData y espera a que se resuelvan las promesas de levels
      const quotationsWithLevels = await Promise.all(
        quotations.map(async (quotation) => ({
          id: quotation.id,
          name: quotation.name,
          status: quotation.status,
          totalAmount: quotation.totalAmount,
          metering: quotation.metering,
          client: {
            id: quotation.client.id,
            name: quotation.client.name,
          },
        })),
      );

      return quotationsWithLevels as QuotationSummaryData[];
    } catch (error) {
      this.logger.error('Error getting all quotations');
      handleException(error, 'Error getting all quotations');
    }
  }

  /**
   * Buscar una cotizacion por su ID.
   * Incluye las cotizaciones REJECTED solo si el usuario es un superadmin
   *
   * @param id ID de la cotizacion a buscar
   * @param user usuario que realiza la peticion
   * @returns Cotizacion encontrado
   */
  async findOne(id: string, user: UserData): Promise<QuotationDataNested> {
    // If the user is a superadmin include all 3 statuses,
    // otherwise hide the REJECTED quotations
    const selectedStatus: QuotationStatusType[] = user.isSuperAdmin
      ? ['APPROVED', 'PENDING', 'REJECTED']
      : ['APPROVED', 'PENDING'];

    const quotation = await this.prisma.quotation.findUnique({
      where: {
        id,
        status: {
          in: selectedStatus,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
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
        client: {
          select: {
            id: true,
            name: true,
          },
        },
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
    });

    if (quotation === null) {
      throw new NotFoundException('Quotation not found');
    }

    return {
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
      createdAt: quotation.createdAt,
      client: {
        id: quotation.client.id,
        name: quotation.client.name,
      },
      levels: quotation.levels.map((level) => ({
        id: level.id,
        name: level.name,
        spaces: level.LevelsOnSpaces.map((space) => ({
          id: space.space.id,
          name: space.space.name,
          amount: space.amount,
          area: space.area,
        })),
      })),
    };
  }

  /**
   * Actualiza los datos de una cotizacion.
   * Si el estado de la cotizacion es APPROVED o REJECTED, esta funcion
   * lanza 400
   *
   * @param id ID de la cotizacion a actualizar
   * @param updateQuotationDto datos a actualizar
   * @param user usuario que realiza la accion
   */
  async update(
    id: string,
    updateQuotationDto: UpdateQuotationDto,
    user: UserPayload,
  ): Promise<HttpResponse<undefined>> {
    const {
      name,
      description,
      discount,
      deliveryTime,
      exchangeRate,
      landArea,
      paymentSchedule,
      integratedProjectDetails,
      architecturalCost,
      structuralCost,
      electricCost,
      sanitaryCost,
      metering,
      levels,
      clientId,
      totalAmount,
    } = updateQuotationDto;

    console.log('lo que me llega:', updateQuotationDto);

    if (Object.keys(updateQuotationDto).length === 0) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Quotation updated successfully',
        data: undefined,
      };
    }

    await this.prisma.$transaction(async (prisma) => {
      const storedQuotation = await prisma.quotation.findUnique({
        where: { id },
      });

      if (storedQuotation === null) {
        throw new NotFoundException('Quotation not found');
      }

      if (storedQuotation.status === 'APPROVED') {
        throw new BadRequestException(
          'Attempted to edit an APPROVED quotation',
        );
      }
      if (storedQuotation.status === 'REJECTED') {
        throw new BadRequestException('Attempted to edit a REJECTED quotation');
      }

      const clientExists = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!clientExists) {
        throw new BadRequestException('Client not found');
      }

      let changesPresent = false;
      for (const newField in updateQuotationDto) {
        const newValue = updateQuotationDto[newField];
        if (newValue !== storedQuotation[newField]) {
          changesPresent = true;
          break;
        }
      }

      if (!changesPresent) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Quotation updated successfully',
          data: undefined,
        };
      }

      const dataactualizada = await prisma.quotation.update({
        where: {
          id,
        },
        data: {
          name,
          description,
          client: {
            connect: {
              id: clientId,
            },
          },
          totalAmount,
          discount,
          deliveryTime,
          exchangeRate,
          landArea,
          paymentSchedule,
          integratedProjectDetails,
          architecturalCost,
          structuralCost,
          electricCost,
          sanitaryCost,
          metering,
        },
      });

      console.log('data actualizada:', dataactualizada);

      const existingLevels = await prisma.level.findMany({
        where: { quotationId: id },
        select: {
          id: true,
          name: true,
          LevelsOnSpaces: {
            select: {
              id: true,
              amount: true,
              area: true,
              spaceId: true, // Este es el espacio correcto que usaremos para comparar
            },
          },
        },
      });

      const newLevelNames = levels.map((level) => level.name);

      const levelsToDelete = existingLevels.filter(
        (level) => !newLevelNames.includes(level.name),
      );

      console.log(levelsToDelete);

      for (const level of levelsToDelete) {
        // Primero eliminamos los registros asociados en LevelsOnSpaces
        await prisma.levelsOnSpaces.deleteMany({
          where: { levelId: level.id },
        });

        // Luego eliminamos el nivel en sí
        await prisma.level.delete({
          where: { id: level.id },
        });
      }

      for (const levelDto of levels) {
        const existingLevel = existingLevels.find(
          (level) => level.name === levelDto.name,
        );

        if (existingLevel) {
          const existingSpaces = existingLevel.LevelsOnSpaces;

          // Corregimos la comparación entre spaceId de LevelsOnSpaces y el spaceId de levelDto.spaces
          const spacesToDelete = existingSpaces.filter(
            (space) =>
              !levelDto.spaces.some((s) => s.spaceId === space.spaceId),
          );

          for (const space of spacesToDelete) {
            await prisma.levelsOnSpaces.delete({
              where: { id: space.id },
            });
          }

          for (const spaceDto of levelDto.spaces) {
            const existingSpace = existingSpaces.find(
              (space) => space.spaceId === spaceDto.spaceId,
            );

            if (existingSpace) {
              await prisma.levelsOnSpaces.update({
                where: { id: existingSpace.id },
                data: {
                  amount: spaceDto.amount,
                  area: spaceDto.area,
                },
              });
            } else {
              const spaceExists = await prisma.spaces.findUnique({
                where: { id: spaceDto.spaceId },
              });

              if (!spaceExists) {
                throw new BadRequestException(
                  `Space with id ${spaceDto.spaceId} not found`,
                );
              }

              await prisma.levelsOnSpaces.create({
                data: {
                  amount: spaceDto.amount,
                  area: spaceDto.area,
                  levelId: existingLevel.id,
                  spaceId: spaceDto.spaceId,
                },
              });
            }
          }
        } else {
          const newLevel = await prisma.level.create({
            data: {
              name: levelDto.name,
              quotationId: id,
            },
          });

          for (const spaceDto of levelDto.spaces) {
            const spaceExists = await prisma.spaces.findUnique({
              where: { id: spaceDto.spaceId },
            });

            if (!spaceExists) {
              throw new BadRequestException(
                `Space with id ${spaceDto.spaceId} not found`,
              );
            }

            await prisma.levelsOnSpaces.create({
              data: {
                amount: spaceDto.amount,
                area: spaceDto.area,
                levelId: newLevel.id,
                spaceId: spaceDto.spaceId,
              },
            });
          }
        }
      }

      await this.audit.create({
        entityId: id,
        entityType: 'quotation',
        action: AuditActionType.UPDATE,
        performedById: user.id,
        createdAt: new Date(),
      });
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Quotation updated successfully',
      data: undefined,
    };
  }

  /**
   * Actualiza el estado de una cotizacion
   *
   * @param id id de la cotizacion a actualizar
   * @param updateQuotationStatusDto datos a usar en la actualizacion
   * @param user usuario que realiza la accion
   */
  async updateStatus(
    id: string,
    updateQuotationStatusDto: UpdateQuotationStatusDto,
    user: UserData,
  ): Promise<HttpResponse<undefined>> {
    const newStatus = updateQuotationStatusDto.newStatus;

    await this.prisma.$transaction(async (prisma) => {
      const currentStatus = await prisma.quotation.findUnique({
        where: {
          id,
        },
        select: {
          status: true,
        },
      });

      // if the quotation doesn's exist, throw
      if (currentStatus === null) {
        throw new NotFoundException('Quotation not found');
      }

      if (currentStatus.status === newStatus) {
        // nothing to update, skip
        return {
          statusCode: HttpStatus.OK,
          message: 'Status updated',
          data: undefined,
        };
      }

      // update the status
      await prisma.quotation.update({
        where: {
          id,
        },
        data: {
          status: newStatus,
        },
      });

      // store the action in audit
      await this.audit.create({
        entityId: id,
        entityType: 'quotation',
        action: AuditActionType.UPDATE,
        performedById: user.id,
        createdAt: new Date(),
      });
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Status updated',
      data: undefined,
    };
  }

  /**
   * Desactiva las cotizaciones enviadas (establece su estado en REJECTED).
   * Si alguna de las cotizaciones no existe, o esta APPROVED
   * falla.
   *
   * @param deleteDto ids de las cotizaciones a desactivar
   * @param user usuario que realiza la accion
   */
  async removeAll(
    deleteDto: DeleteQuotationsDto,
    user: UserData,
  ): Promise<HttpResponse<undefined>> {
    await this.prisma.$transaction(async (prisma) => {
      const quotationToDelete = await prisma.quotation.findMany({
        where: {
          id: {
            in: deleteDto.ids,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      // If a quotation is not found throw an error
      const missingQuotationIds = deleteDto.ids.filter((id) => {
        return quotationToDelete.find((quot) => quot.id === id) === undefined;
      });
      if (missingQuotationIds.length !== 0) {
        this.logger.log(
          `Remove quotation: Quotation with ids ${JSON.stringify(missingQuotationIds)} not found`,
        );
        throw new BadRequestException('Quotation not found');
      }

      // if a quotation is already APPROVED, throw an error
      const approvedQuotationIds = quotationToDelete.filter((quotation) => {
        return quotation.status === 'APPROVED';
      });
      if (approvedQuotationIds.length !== 0) {
        this.logger.log(
          `Remove quotation: Quotation with ids ${JSON.stringify(missingQuotationIds)} not found`,
        );
        throw new BadRequestException('Valid quotation not found');
      }

      // deactivate all
      await prisma.quotation.updateMany({
        where: {
          id: {
            in: deleteDto.ids,
          },
        },
        data: {
          status: 'REJECTED',
        },
      });

      // log in audit
      const now = new Date();
      const updateRecords = deleteDto.ids.map((quotationId) => ({
        action: AuditActionType.DELETE,
        entityId: quotationId,
        entityType: 'quotation',
        performedById: user.id,
        createdAt: now,
      }));
      await prisma.audit.createMany({
        data: updateRecords,
      });
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Quotations deactivated successfully',
      data: undefined,
    };
  }

  /**
   * Reactiva las cotizaciones enviadas (establece su estado en PENDING).
   * Si alguna de las cotizaciones no existe, o esta APPROVED, falla
   *
   * @param reactivateDto ids a reactivar
   * @param user usuario que realiza la accion
   */
  async reactivateAll(user: UserData, reactivateDto: DeleteQuotationsDto) {
    await this.prisma.$transaction(async (prisma) => {
      const quotationToReactivate = await prisma.quotation.findMany({
        where: {
          id: {
            in: reactivateDto.ids,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      // If a quotation is not found throw an error
      const missingQuotationIds = reactivateDto.ids.filter((id) => {
        return (
          quotationToReactivate.find((quot) => quot.id === id) === undefined
        );
      });
      if (missingQuotationIds.length !== 0) {
        throw new BadRequestException(
          `Quotation with ids ${JSON.stringify(missingQuotationIds)} not found`,
        );
      }

      // if a quotation is already APPROVED, throw an error
      const approvedQuotationIds = quotationToReactivate.filter((quotation) => {
        return quotation.status === 'APPROVED';
      });
      if (approvedQuotationIds.length !== 0) {
        this.logger.log(
          `Quotation with ids ${JSON.stringify(missingQuotationIds)} are APPROVED and cannot be reactivated`,
        );
        throw new BadRequestException("Quotations can't be reactivated");
      }

      // reactivate all
      await prisma.quotation.updateMany({
        where: {
          id: {
            in: reactivateDto.ids,
          },
        },
        data: {
          status: 'PENDING',
        },
      });

      // log in audit
      const now = new Date();
      const updateRecords = reactivateDto.ids.map((quotationId) => ({
        action: AuditActionType.UPDATE,
        entityId: quotationId,
        entityType: 'quotation',
        performedById: user.id,
        createdAt: now,
      }));
      await prisma.audit.createMany({
        data: updateRecords,
      });
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Quotations reactivated successfully',
    };
  }

  async genPdf(id: string, user: UserData): Promise<StreamableFile> {
    // Get the quotation
    const quotation = await this.findOne(id, user);

    const editCount = await this.prisma.audit.count({
      where: {
        entityId: quotation.id,
      },
    });

    // Render the quotation into HTML
    const pdfHtml = await this.template.renderPdf(quotation, editCount);

    // Generar el PDF usando Puppeteer
    const browser = await Puppeteer.launch();
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
    });
    await browser.close();

    return new StreamableFile(pdfBufferUint8Array, {
      type: 'application/pdf',
      disposition: 'attachment; filename="cotizacion_demo_2.pdf"',
    });
  }

  async genPdfTemplate(id: string, user: UserData): Promise<string> {
    // Get the quotation
    const quotation = await this.findOne(id, user);

    const editCount = await this.prisma.audit.count({
      where: {
        entityId: quotation.id,
      },
    });

    return this.template.renderPdf(quotation, editCount);
  }

  async validateApprovedQuotation(
    quotationId: string,
    user: UserData,
  ): Promise<void> {
    const quotation = await this.findOne(quotationId, user);

    if (!quotation) {
      throw new NotFoundException(`Quotation not found`);
    }

    if (quotation.status !== 'APPROVED') {
      throw new BadRequestException(`Quotation is not approved`);
    }
  }
}
