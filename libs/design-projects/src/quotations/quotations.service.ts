import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-status.dto';
import { AuditActionType } from '@prisma/client';
import { UserData } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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
      const newQuotation = await prisma.quotation.create({
        data: {
          name,
          code,
          status,
          client: {
            connect: {
              id: clientId,
            },
          },
          seller: {
            connect: {
              id: sellerId,
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

  findAll() {
    return `This action returns all quotations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} quotation`;
  }

  update(id: number, updateQuotationDto: UpdateQuotationDto) {
    return `This action updates a #${id} quotation ${updateQuotationDto}`;
  }

  async updateStatus(
    id: string,
    updateQuotationStatusDto: UpdateQuotationStatusDto,
    user: UserData,
  ) {
    const newStatus = updateQuotationStatusDto.newStatus;

    await this.prisma.$transaction(async (prisma) => {
      const currentStatus = await prisma.quotation.findUniqueOrThrow({
        where: {
          id,
        },
        select: {
          status: true,
        },
      });

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
