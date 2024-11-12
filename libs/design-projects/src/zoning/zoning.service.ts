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
import { DeleteZoningDto } from './dto/delete-zoning.dto';

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

  private validatePercentage(buildableArea: number, openArea: number) {
    if (buildableArea + openArea !== 100) {
      throw new BadRequestException(
        'The sum of buildable area and open area must be 100',
      );
    }
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
      await this.validatePercentage(buildableArea, openArea);
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

  /**
   * Actualizar una zonificación
   * @param id Id de la zonificación
   * @param updateZoningDto Data de la zonificación a actualizar
   * @param user Data del usuario que realiza la acción
   * @returns Data de la zonificación actualizada
   */
  async update(
    id: string,
    updateZoningDto: UpdateZoningDto,
    user: UserData,
  ): Promise<HttpResponse<ZoningData>> {
    const { zoneCode, description, buildableArea, openArea } = updateZoningDto;

    try {
      const zoningDB = await this.findById(id);

      if (zoneCode) {
        await this.findByZoneCode(zoneCode, id);
      }
      // Validar que la suma de las áreas sea 100
      if (buildableArea || openArea) {
        this.validatePercentage(
          buildableArea || zoningDB.buildableArea,
          openArea || zoningDB.openArea,
        );
      }

      // Validar si hay cambios
      const noChanges =
        (zoneCode === undefined || zoneCode === zoningDB.zoneCode) &&
        (description === undefined || description === zoningDB.description) &&
        (buildableArea === undefined ||
          buildableArea === zoningDB.buildableArea) &&
        (openArea === undefined || openArea === zoningDB.openArea);

      if (noChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Zoning updated successfully',
          data: {
            id: zoningDB.id,
            zoneCode: zoningDB.zoneCode,
            description: zoningDB.description,
            buildableArea: zoningDB.buildableArea,
            openArea: zoningDB.openArea,
            isActive: zoningDB.isActive,
          },
        };
      }

      // Construir el objeto de actualización dinámicamente solo con los campos presentes
      const updateData: any = {};
      if (zoneCode !== undefined && zoneCode !== zoningDB.zoneCode)
        updateData.zoneCode = zoneCode;
      if (description !== undefined && description !== zoningDB.description)
        updateData.description = description;
      if (
        buildableArea !== undefined &&
        buildableArea !== zoningDB.buildableArea
      )
        updateData.buildableArea = buildableArea;
      if (openArea !== undefined && openArea !== zoningDB.openArea)
        updateData.openArea = openArea;

      // Transacción para realizar la actualización
      const updatedZoning = await this.prisma.$transaction(async (prisma) => {
        const zoning = await prisma.zoning.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            zoneCode: true,
            description: true,
            buildableArea: true,
            openArea: true,
            isActive: true,
          },
        });
        // Crear un registro de auditoría
        await prisma.audit.create({
          data: {
            entityId: zoning.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'zoning',
          },
        });

        return zoning;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Zoning updated successfully',
        data: updatedZoning,
      };
    } catch (error) {
      this.logger.error(`Error updating zoning: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a zoning');
    }
  }

  /**
   * Activar varias zonificaciones
   * @param user Data del usuario que realiza la acción
   * @param zoning Data de las zonificaciones a reactivar
   * @returns Data de las zonificaciones reactivadas
   */
  async reactivateAll(
    user: UserData,
    zoning: DeleteZoningDto,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los zonificaciones en la base de datos
        const zoningDB = await prisma.zoning.findMany({
          where: {
            id: { in: zoning.ids },
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

        // Validar que se encontraron las zonificaciones
        if (zoningDB.length === 0) {
          throw new NotFoundException('Zoning not found or inactive');
        }

        // Reactivar zonificaciones
        const reactivatePromises = zoningDB.map(async (zoningType) => {
          // Activar la zonificación
          await prisma.zoning.update({
            where: { id: zoningType.id },
            data: { isActive: true },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.UPDATE,
              entityId: zoningType.id,
              entityType: 'zoning',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: zoningType.id,
            zoneCode: zoningType.zoneCode,
            description: zoningType.description,
            buildableArea: zoningType.buildableArea,
            openArea: zoningType.openArea,
            isActive: zoningType.isActive,
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Zoning reactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error reactivating zoning', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error reactivating zoning');
    }
  }

  /**
   * Eliminar varias zonificaciones
   * @param zoning Data de las zonificaciones a eliminar
   * @param user Data del usuario que realiza la acción
   */
  async removeAll(
    zoning: DeleteZoningDto,
    user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar las zonificaciones en la base de datos
        const zoningDB = await prisma.zoning.findMany({
          where: {
            id: { in: zoning.ids },
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

        // Validar que se encontraron las zonificaciones
        if (zoningDB.length === 0) {
          throw new NotFoundException('Zoning not found or inactive');
        }

        const deactivatePromises = zoningDB.map(async (zoningDelete) => {
          // Desactivar zonificación
          await prisma.zoning.update({
            where: { id: zoningDelete.id },
            data: { isActive: false },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.DELETE,
              entityId: zoningDelete.id,
              entityType: 'zoning',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: zoningDelete.id,
            zoneCode: zoningDelete.zoneCode,
            description: zoningDelete.description,
            buildableArea: zoningDelete.buildableArea,
            openArea: zoningDelete.openArea,
            isActive: zoningDelete.isActive,
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Zoning deactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error deactivating zoning', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error deactivating zoning');
    }
  }
}
