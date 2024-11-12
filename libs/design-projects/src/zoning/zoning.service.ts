import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateZoningDto } from './dto/create-zoning.dto';
import { UpdateZoningDto } from './dto/update-zoning.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { ZoningData } from '../interfaces';
import { handleException } from '@login/login/utils';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class ZoningService {
  private readonly logger = new Logger(ZoningService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validación de existencia de la zonificación por su zoneCode
   * @param zoneCode Codigo de la zonificación
   * @param id Id de la zonificación
   * @returns Data de la zonificación
   */
  async findByZoneCode(zoneCode: string, id?: string): Promise<ZoningData> {
    const zoningDB = await this.prisma.zoning.findFirst({
      where: { zoneCode },
      select: {
        id: true,
        zoneCode: true,
        description: true,
        buildableArea: true,
        openArea: true,
        isActive: true,
      },
    });

    if (!!zoningDB && zoningDB.id !== id) {
      if (!zoningDB.isActive) {
        throw new BadRequestException(
          'This zoningCode is inactive, contact the superadmin to reactivate it',
        );
      }
      if (zoningDB) {
        throw new BadRequestException('This zoningCode already exists');
      }
    }

    return zoningDB;
  }

  /**
   * Crear una nueva zonificación
   * @param createZoningDto Data de la zonificación a crear
   * @param user Data del usuario que realiza la acción
   * @returns Data de la zonificación creada
   */
  async create(
    createZoningDto: CreateZoningDto,
    user: UserData,
  ): Promise<HttpResponse<ZoningData>> {
    const { zoneCode, description, buildableArea, openArea } = createZoningDto;
    let newZoning;

    try {
      // Crear la zonificación y registrar la auditoría
      await this.findByZoneCode(zoneCode);
      newZoning = await this.prisma.$transaction(async () => {
        // Crear el nueva zonificación
        const zoning = await this.prisma.zoning.create({
          data: {
            zoneCode,
            description,
            buildableArea,
            openArea,
          },
          select: {
            id: true,
            zoneCode: true,
            description: true,
            buildableArea: true,
            openArea: true,
            isActive: true,
          },
        });

        // Registrar la auditoría de la creación de la zonificación
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: zoning.id,
            entityType: 'zoning',
            performedById: user.id,
          },
        });

        return zoning;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Zoning created successfully',
        data: {
          id: newZoning.id,
          zoneCode: newZoning.zoneCode,
          description: newZoning.description,
          buildableArea: newZoning.buildableArea,
          openArea: newZoning.openArea,
          isActive: newZoning.isActive,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating zoning: ${error.message}`, error.stack);

      if (newZoning) {
        await this.prisma.zoning.delete({ where: { id: newZoning.id } });
        this.logger.error(`Zoning has been deleted due to error in creation.`);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a zoning');
    }
  }

  findAll() {
    return `This action returns all zoning`;
  }

  findOne(id: string) {
    return `This action returns a #${id} zoning`;
  }

  update(id: string, updateZoningDto: UpdateZoningDto) {
    return `This action updates a #${id} ${updateZoningDto} zoning`;
  }

  remove(id: string) {
    return `This action removes a #${id} zoning`;
  }
}
