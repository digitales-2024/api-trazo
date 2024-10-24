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
  async findByName(name: string): Promise<SpaceData> {
    const spacetDB = await this.prisma.spaces.findFirst({
      where: { name },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    });

    if (!!spacetDB && !spacetDB.isActive) {
      throw new BadRequestException('This space exists but is not active');
    }
    if (spacetDB) {
      throw new BadRequestException('This name is already in use');
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

  update(id: number, updateSpaceDto: UpdateSpaceDto) {
    return `This action updates a #${id} ${updateSpaceDto} space`;
  }

  remove(id: number) {
    return `This action removes a #${id} space`;
  }
}
