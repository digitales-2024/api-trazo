import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-status.dto';
import {
  AuditActionType,
  Quotation,
  QuotationStatusType,
} from '@prisma/client';
import { UserData, UserPayload } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { ClientsService } from '@clients/clients';
import { UsersService } from '@login/login/admin/users/users.service';
import { DeleteQuotationsDto } from './dto/delete-quotation.dto';

// [x] solo el superadmin puede GET todas las cotizaciones
// [x] el resto de usuarios solo puede ver cotizaciones APPROVED/PENDING
// [x] el estado REJECTED de la cotizacion cuenta como eliminado
// [x] solo se pueden editar cotizaciones PENDING
// [ ] implementar deactivate/reactivate

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly clientService: ClientsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Crea una cotizacion.
   */
  async create(createQuotationDto: CreateQuotationDto, user: UserData) {
    const {
      name,
      code,
      clientId,
      sellerId,
      status,
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
      metrado,
    } = createQuotationDto;

    // Creates a simple quotation, just for demo purposes
    await this.prisma.$transaction(async (prisma) => {
      // get client and seller via their services
      const sellerUser = await this.usersService.findById(sellerId);
      const client = await this.clientService.findById(clientId);

      const newQuotation = await prisma.quotation.create({
        data: {
          name,
          code,
          status,
          // tabla client
          client: {
            connect: {
              id: client.id,
            },
          },
          // tabla user
          seller: {
            connect: {
              id: sellerUser.id,
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
          metrado,
        },
        select: {
          id: true,
        },
      });

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
   * Obtener todas las cotizaciones
   * Incluye las cotizaciones REJECTED solo si el usuario es un superadmin
   *
   * @param user usuario que realiza la peticion
   * @returns Todas las cotizaciones
   */
  async findAll(user: UserData): Promise<Array<Quotation>> {
    // If the user is a superadmin include all 3 statuses,
    // otherwise hide the REJECTED quotations
    const selectedStatus: QuotationStatusType[] = user.isSuperAdmin
      ? ['APPROVED', 'PENDING', 'REJECTED']
      : ['APPROVED', 'PENDING'];

    // if the user is a superadmin
    const allQuotations = await this.prisma.quotation.findMany({
      where: {
        status: {
          in: selectedStatus,
        },
      },
    });

    return allQuotations;
  }

  /**
   * Buscar una cotizacion por su ID.
   * Incluye las cotizaciones REJECTED solo si el usuario es un superadmin
   *
   * @param id ID de la cotizacion a buscar
   * @param user usuario que realiza la peticion
   * @returns Cotizacion encontrado
   */
  async findOne(id: string, user: UserData): Promise<Quotation> {
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
    });

    if (quotation === null) {
      throw new NotFoundException('Quotation not found');
    }

    return quotation;
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
  ) {
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

  async updateStatus(
    id: string,
    updateQuotationStatusDto: UpdateQuotationStatusDto,
    user: UserData,
  ) {
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

  async removeAll(deleteDto: DeleteQuotationsDto, user: UserData) {
    await this.prisma.$transaction(async (prisma) => {
      const quotationToDelete = await prisma.quotation.findMany({
        where: {
          id: {
            in: deleteDto.ids,
          },
        },
        select: {
          id: true,
        },
      });

      // If a quotation is not found throw an error
      const missingQuotationIds = deleteDto.ids.filter((id) => {
        return quotationToDelete.find((quot) => quot.id === id) === undefined;
      });
      if (missingQuotationIds.length !== 0) {
        throw new BadRequestException(
          `Quotation with ids ${JSON.stringify(missingQuotationIds)} not found`,
        );
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
    };
  }
}
