import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { SpaceData } from '../interfaces/spaces.interfaces';
import { handleException } from '@login/login/utils';
import { AuditActionType } from '@prisma/client';
import { DeleteSpaceDto } from './dto/delete-space.dto';

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createSpaceDto: CreateSpaceDto,
    user: UserData,
  ): Promise<HttpResponse<SpaceData>> {
    const { name, description } = createSpaceDto;
    await this.findByName(name);
    try {
      const newSpace = await this.prisma.$transaction(async () => {
        // Crear el nuevo ambientes
        const space = await this.prisma.spaces.create({
          data: {
            name,
            description,
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        });

        // Registrar la auditoría de la creación del ambientes
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: space.id,
            entityType: 'spaces',
            performedById: user.id,
          },
        });

        return space;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Space created successfully',
        data: {
          id: newSpace.id,
          name: newSpace.name,
          description: newSpace.description,
          isActive: newSpace.isActive,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating space: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a space');
    }
  }

  /**
   * Mostrar ambiente por el nombre
   * @param name nombre del ambiente
   * @returns Ambiente encontrado por nombre
   */
  async findByName(name: string, id?: string): Promise<SpaceData> {
    const spacetDB = await this.prisma.spaces.findFirst({
      where: { name },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    });
    if (!!spacetDB && spacetDB.id !== id) {
      if (!!spacetDB && !spacetDB.isActive) {
        throw new BadRequestException('This space exists but is not active');
      }
      if (spacetDB) {
        throw new BadRequestException('This space already exists');
      }
    }

    return spacetDB;
  }

  /**
   * Mostar todos los ambientes
   * @param user usuario solicitante
   * @returns todos los ambientes
   */
  async findAll(user: UserPayload): Promise<SpaceData[]> {
    try {
      const spaces = await this.prisma.spaces.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
        },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo SapceData
      return spaces.map((space) => ({
        id: space.id,
        name: space.name,
        description: space.description,
        isActive: space.isActive,
      })) as SpaceData[];
    } catch (error) {
      this.logger.error('Error getting all spaces');
      handleException(error, 'Error getting all spaces');
    }
  }

  /**
   * Buscar un ambiente por id
   * @param id id del ambiente
   * @returns Ambiente encontrado por id
   */

  async findOne(id: string): Promise<SpaceData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get spaces');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get spaces');
    }
  }

  /**
   * valdiacion del ambiente por id
   * @param id id del ambiente
   * @returns Ambiente encontrado por id
   */

  async findById(id: string): Promise<SpaceData> {
    const sapaceDb = await this.prisma.spaces.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    });
    if (!sapaceDb) {
      throw new BadRequestException('This space doesnt exist');
    }

    if (!!sapaceDb && !sapaceDb.isActive) {
      throw new BadRequestException('This space exist, but is inactive');
    }

    return sapaceDb;
  }

  /**
   * Actualizar un ambiente
   * @param id id del ambiente
   * @param updateSpaceDto datos del ambiente a actualizar
   * @returns Ambiente actualizado
   */

  async update(
    id: string,
    updateSpaceDto: UpdateSpaceDto,
    user: UserData,
  ): Promise<HttpResponse<SpaceData>> {
    const { name, description } = updateSpaceDto;
    if (name) {
      await this.findByName(name);
    }

    try {
      const spaceDB = await this.findById(id);

      // Validar si hay cambios
      const noChanges =
        (name === undefined || name === spaceDB.name) &&
        (description === undefined || description === spaceDB.description);

      if (noChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Spaces updated successfully',
          data: {
            id: spaceDB.id,
            name: spaceDB.name,
            description: spaceDB.description,
            isActive: spaceDB.isActive,
          },
        };
      }

      // Construir el objeto de actualización dinámicamente solo con los campos presentes
      const updateData: any = {};
      if (name !== undefined && name !== spaceDB.name) updateData.name = name;
      if (description !== undefined && description !== spaceDB.description)
        updateData.description = description;

      // Transacción para realizar la actualización
      const updatedSpaces = await this.prisma.$transaction(async (prisma) => {
        const spaces = await prisma.spaces.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        });
        // Crear un registro de auditoría
        await prisma.audit.create({
          data: {
            entityId: spaces.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'space',
          },
        });

        return spaces;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Space updated successfully',
        data: updatedSpaces,
      };
    } catch (error) {
      this.logger.error(`Error updating Space: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a Space');
    }
  }

  remove(id: number) {
    return `This action removes a #${id} space`;
  }

  /**
   * Activar varios spaces
   * @param user Spaces que realiza la acción
   * @param spaces Dto con los IDs de los spaces a Activar
   * @returns Respuesta de éxito
   */

  async reactivateAll(
    user: UserData,
    deleteSpaceDto: DeleteSpaceDto,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los spaces en la base de datos
        const spacesDB = await prisma.spaces.findMany({
          where: {
            id: { in: deleteSpaceDto.ids },
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        });

        // Validar que se encontraron los spaces
        if (spacesDB.length === 0) {
          throw new NotFoundException('Space not found or inactive');
        }

        // Reactivar spaces
        const reactivatePromises = spacesDB.map(async (space) => {
          // Activar el cliente
          await prisma.spaces.update({
            where: { id: space.id },
            data: { isActive: true },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.UPDATE,
              entityId: space.id,
              entityType: 'space',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: space.id,
            name: space.name,
            description: space.description,
            isActive: space.isActive,
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Space reactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error reactivating Space', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error reactivating space');
    }
  }

  /**
   * Desactivar varios spaces
   * @param user Spaces que realiza la acción
   * @param spaces Dto con los IDs de los spaces a desactivar
   * @returns Respuesta de éxito
   */

  async removeAll(
    user: UserData,
    deleteSpaceDto: DeleteSpaceDto,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los spaces en la base de datos
        const spacesDB = await prisma.spaces.findMany({
          where: {
            id: { in: deleteSpaceDto.ids },
          },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        });

        // Validar que se encontraron los spaces
        if (spacesDB.length === 0) {
          throw new NotFoundException('space not found or inactive');
        }

        // desactivar spaces
        const deactivatePromises = spacesDB.map(async (space) => {
          // Activar el cliente
          await prisma.spaces.update({
            where: { id: space.id },
            data: { isActive: false },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.DELETE,
              entityId: space.id,
              entityType: 'space',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: space.id,
            name: space.name,
            description: space.description,
            isActive: space.isActive,
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Space deactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error deactivating Space', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error deactivating space');
    }
  }
}
