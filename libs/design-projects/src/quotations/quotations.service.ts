import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-status.dto';
import { AuditActionType, QuotationStatusType } from '@prisma/client';
import { UserData } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  create(createQuotationDto: CreateQuotationDto) {
    return 'This action adds a new quotation: ' + createQuotationDto;
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
    let newStatus: QuotationStatusType;
    switch (updateQuotationStatusDto.newStatus) {
      case 'PENDING':
        newStatus = QuotationStatusType.PENDING;
        break;
      case 'APPROVED':
        newStatus = QuotationStatusType.APPROVED;
        break;
      case 'REJECTED':
        newStatus = QuotationStatusType.REJECTED;
        break;
    }

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
