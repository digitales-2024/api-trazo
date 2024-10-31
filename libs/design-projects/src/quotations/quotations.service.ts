import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
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
import { QuotationData } from '@clients/clients/interfaces';
import { handleException } from '@login/login/utils';
import { QuotationDataNested } from '@clients/clients/interfaces/quotation.interface';

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly clientService: ClientsService,
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
    } = createQuotationDto;

    await this.prisma.$transaction(async (prisma) => {
      // get client via their services
      const client = await this.clientService.findById(clientId);

      // validate that all the spaceIds exist
      // get all spaceids
      const spaceIds = levels.flatMap((level) =>
        level.spaces.map((space) => space.spaceId),
      );
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
        throw new BadRequestException('Error creating quotaion');
      }

      // create the quotation along with its associated levels
      const newQuotation = await prisma.quotation.create({
        data: {
          name,
          code,
          // tabla client
          client: {
            connect: {
              id: client.id,
            },
          },
          totalAmount: 0,
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

        // continue
      }

      // TODO: registrar en audit todos los niveles y nivel-ambiente creados
      // Registrar la accion en Audit
      await this.audit.create({
        entityId: newQuotation.id,
        entityType: 'business',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: new Date(),
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
  async findAll(user: UserPayload): Promise<QuotationData[]> {
    try {
      const products = await this.prisma.quotation.findMany({
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
          code: true,
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

      // Mapea los resultados al tipo QuotationData
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        code: product.code,
        status: product.status,
        discount: product.discount,
        totalAmount: product.totalAmount,
        deliveryTime: product.deliveryTime,
        exchangeRate: product.exchangeRate,
        landArea: product.landArea,
        paymentSchedule: product.paymentSchedule,
        integratedProjectDetails: product.integratedProjectDetails,
        architecturalCost: product.architecturalCost,
        structuralCost: product.structuralCost,
        electricCost: product.electricCost,
        sanitaryCost: product.sanitaryCost,
        metering: product.metering,
        client: {
          id: product.client.id,
          name: product.client.name,
        },
      })) as QuotationData[];
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
      client: {
        id: quotation.client.id,
        name: quotation.client.name,
      },
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
    // Si no hay datos que actualizar, salir antes
    if (Object.keys(updateQuotationDto).length === 0) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Quotation updated successfully',
        data: undefined,
      };
    }

    await this.prisma.$transaction(async (prisma) => {
      // get the current quotation
      const storedQuotation = await prisma.quotation.findUnique({
        where: { id },
      });

      // if the quotation doesn's exist, throw
      if (storedQuotation === null) {
        throw new NotFoundException('Quotation not found');
      }

      // If the status is APPROVED or PENDING, throw
      if (storedQuotation.status === 'APPROVED') {
        throw new BadRequestException(
          'Attempted to edit an APPROVED quotation',
        );
      }
      if (storedQuotation.status === 'REJECTED') {
        throw new BadRequestException('Attempted to edit a REJECTED quotation');
      }

      // check there are changed fields
      let changesPresent = false;
      for (const newField in updateQuotationDto) {
        const newValue = updateQuotationDto[newField];
        if (newValue !== storedQuotation[newField]) {
          changesPresent = true;
          break;
        }
      }

      if (!changesPresent) {
        // return early
        return {
          statusCode: HttpStatus.OK,
          message: 'Quotation updated successfully',
          data: undefined,
        };
      }

      // update database
      await prisma.quotation.update({
        where: {
          id,
        },
        data: updateQuotationDto,
      });

      // update audit log
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
}
