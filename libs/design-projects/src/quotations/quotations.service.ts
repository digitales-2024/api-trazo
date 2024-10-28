import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-status.dto';
import { AuditActionType, Quotation } from '@prisma/client';
import { UserData, UserPayload } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { ClientsService } from '@clients/clients';
import { UsersService } from '@login/login/admin/users/users.service';

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
   * @returns Todas las cotizaciones
   */
  async findAll(): Promise<Array<Quotation>> {
    return await this.prisma.quotation.findMany();
  }

  /**
   * Buscar una cotizacion por su ID
   * @param id ID de la cotizacion a buscar
   * @returns Cotizacion encontrado
   */
  async findOne(id: string): Promise<Quotation> {
    const quotation = await this.prisma.quotation.findUnique({
      where: {
        id,
      },
    });

    if (quotation === null) {
      throw new NotFoundException('Quotation not found');
    }

    return quotation;
  }

  /**
   * Actualiza los datos de una cotizacion.
   * Si el estado de la cotizacion es APPROVED, esta funcion
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

      // validate the status is either pending or rejected, otherwise fail
      // if the quotation status is APPROVED, fail this update
      if (storedQuotation.status === 'APPROVED') {
        throw new BadRequestException(
          'Attempted to edit an APPROVED quotation',
        );
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

  remove(id: number) {
    return `This action removes a #${id} quotation`;
  }
}
