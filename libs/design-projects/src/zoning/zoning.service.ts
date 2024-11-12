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
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
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

  /**
   * Obtener todas las zonificaciones
   * @param user Data del usuario que realiza la acción
   * @returns Data de todas las zonificaciones
   */
  async findAll(user: UserPayload): Promise<ZoningData[]> {
    try {
      const zoning = await this.prisma.zoning.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
        },
        select: {
          id: true,
          zoneCode: true,
          description: true,
          buildableArea: true,
          openArea: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo ZoningData
      return zoning.map((zoningType) => ({
        id: zoningType.id,
        zoneCode: zoningType.zoneCode,
        description: zoningType.description,
        buildableArea: zoningType.buildableArea,
        openArea: zoningType.openArea,
        isActive: zoningType.isActive,
      })) as ZoningData[];
    } catch (error) {
      this.logger.error('Error getting all zoning');
      handleException(error, 'Error getting all zoning');
    }
  }

  /**
   * Obtener una zonificación por su id
   * @param id Id de la zonificación
   * @returns Data de la zonificación
   */
  async findOne(id: string): Promise<ZoningData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get zoning');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get zoning');
    }
  }

  /**
   * Obtener una zonificación por su id
   * @param id Id de la zonificación
   * @returns Data de la zonificación
   */
  async findById(id: string): Promise<ZoningData> {
    const zoningDb = await this.prisma.zoning.findFirst({
      where: { id },
      select: {
        id: true,
        zoneCode: true,
        description: true,
        buildableArea: true,
        openArea: true,
        isActive: true,
      },
    });
    if (!zoningDb) {
      throw new BadRequestException('This zoning doesnt exist');
    }

    if (!!zoningDb && !zoningDb.isActive) {
      throw new BadRequestException('This zoning exist, but is inactive');
    }

    return zoningDb;
  }

  update(id: string, updateZoningDto: UpdateZoningDto) {
    return `This action updates a #${id} ${updateZoningDto} zoning`;
  }

  remove(id: string) {
    return `This action removes a #${id} zoning`;
  }
}
