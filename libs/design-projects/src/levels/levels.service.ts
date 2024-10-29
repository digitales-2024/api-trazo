import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { QuotationsService } from '../quotations/quotations.service';
import { AuditActionType, Level } from '@prisma/client';

@Injectable()
export class LevelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly quotationService: QuotationsService,
  ) {}

  /**
   * Creates a new level. If the linked quotation's status is APPROVED, it throws
   * @param createLevelDto the data of the level to create
   * @param user the user that performs this action
   */
  async create(
    createLevelDto: CreateLevelDto,
    user: UserData,
  ): Promise<HttpResponse<Level>> {
    const { name, quotationId } = createLevelDto;
    const newLevel = await this.prisma.$transaction(async (prisma) => {
      // verify the passed quotation exists
      const quotation = await this.quotationService.findOne(quotationId, user);

      // check the quotation is PENDING
      if (quotation.status !== 'PENDING') {
        throw new BadRequestException(
          `Quotation is ${quotation.status}, cannot create a new level`,
        );
      }

      const newLevel = await prisma.level.create({
        data: {
          name,
          quotation: {
            connect: {
              id: quotation.id,
            },
          },
        },
      });

      // Registrar la accion en Audit
      await this.audit.create({
        entityId: newLevel.id,
        entityType: 'level',
        action: AuditActionType.CREATE,
        performedById: user.id,
        createdAt: new Date(),
      });

      return newLevel;
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Level created',
      data: newLevel,
    };
  }

  findAll() {
    return `This action returns all levels`;
  }

  findOne(id: number) {
    return `This action returns a #${id} level`;
  }

  update(id: number, updateLevelDto: UpdateLevelDto) {
    return `This action updates a #${id} level ${updateLevelDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} level`;
  }
}
