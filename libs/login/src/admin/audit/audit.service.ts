import { Injectable } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { PrismaService } from '@login/login/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Crear una nueva auditoría
   * @param createAuditDto Datos de la auditoría a crear
   */
  async create(createAuditDto: CreateAuditDto): Promise<void> {
    await this.prismaService.audit.create({
      data: createAuditDto
    });
  }
}
