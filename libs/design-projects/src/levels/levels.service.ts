import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { QuotationsService } from '../quotations/quotations.service';
import { AuditActionType, Level } from '@prisma/client';
import { LevelUpdateData } from '../interfaces/levels.interfaces';
import { LevelData } from '../interfaces';

@Injectable()
export class LevelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(forwardRef(() => QuotationsService))
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

  /**
   * Devuelve todas las cotizaciones vinculadas a la cotización con `id`
   *
   * @param id id de la *cotizacion* de la cual obtener sus niveles
   * @returns la lista de niveles que pertenecen a la *cotizacion* con `id`
   */
  async findOne(id: string, user: UserData): Promise<LevelData[]> {
    // check there is a quotation with the given id
    await this.quotationService.findOne(id, user);

    const levels = await this.prisma.level.findMany({
      where: {
        quotation: {
          is: {
            id,
          },
        },
      },
      include: {
        LevelsOnSpaces: {
          include: {
            space: true,
          },
        },
      },
    });

    return levels.map((level) => ({
      id: level.id,
      name: level.name,
      spaces: level.LevelsOnSpaces.map((levelOnSpace) => ({
        id: levelOnSpace.space.id,
        name: levelOnSpace.space.name,
        amount: levelOnSpace.amount,
        area: levelOnSpace.area,
      })),
    }));
  }

  /**
   * Actualiza un nivel. Solo es posible actualizar el campo `name`.
   * Si el nivel pertenece a una cotizacion no editable, devuelve un error
   *
   * @param id id del nivel a actualizar
   * @param updateDto datos a actualizar
   * @param user usuario que realiza la accion
   * @returns el nivel tras la eliminacion
   */
  async update(
    id: string,
    updateDto: UpdateLevelDto,
    user: UserData,
  ): Promise<HttpResponse<LevelUpdateData>> {
    // Si no hay datos que actualizar, salir antes
    if (!updateDto.name) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Level updated successfully',
        data: undefined,
      };
    }

    const updatedLevel: LevelUpdateData = await this.prisma.$transaction(
      async (prisma) => {
        const currentLevel = await prisma.level.findUnique({
          where: {
            id,
          },
          select: {
            name: true,
            id: true,
            quotationId: true,
            quotation: {
              select: {
                status: true,
              },
            },
          },
        });

        if (currentLevel === null) {
          // nivel no encontrado
          throw new NotFoundException('Level not found');
        }

        // if the quotation is not editable, throw
        if (currentLevel.quotation.status !== 'PENDING') {
          throw new BadRequestException('Cannot update level');
        }

        if (currentLevel.name === updateDto.name) {
          // Return early if there is nothing to update
          return currentLevel;
        }

        // update
        const updatedLevel = await prisma.level.update({
          where: {
            id,
          },
          data: {
            name: updateDto.name,
          },
        });

        // audit
        await this.audit.create({
          entityId: updatedLevel.id,
          entityType: 'level',
          action: AuditActionType.UPDATE,
          performedById: user.id,
          createdAt: new Date(),
        });

        return updatedLevel;
      },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Level updated successfully',
      data: updatedLevel,
    };
  }

  /**
   * Elimina por completo un nivel, y todos los AmbienteNivel vinculados a este
   * Si la cotizacion a la que pertenece el nivel no es editable, lanza un error
   *
   * @param id id del nivel a eliminar
   * @param user usuario que realiza la accion
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<null>> {
    await this.prisma.$transaction(async (prisma) => {
      const currentLevel = await prisma.level.findUnique({
        where: {
          id,
        },
        select: {
          quotation: {
            select: {
              status: true,
            },
          },
        },
      });

      if (currentLevel === null) {
        // nivel no encontrado
        throw new NotFoundException('Level not found');
      }

      // if the quotation is not editable, throw
      if (currentLevel.quotation.status !== 'PENDING') {
        throw new BadRequestException('Cannot delete level');
      }

      // delete all LevelSpace related to this level
      await prisma.levelsOnSpaces.deleteMany({
        where: {
          levelId: id,
        },
      });

      // delete level
      await prisma.level.delete({
        where: {
          id,
        },
      });

      // audit
      await this.audit.create({
        entityId: id,
        entityType: 'level',
        action: AuditActionType.DELETE,
        performedById: user.id,
        createdAt: new Date(),
      });
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Level deleted successfully',
      data: null,
    };
  }
}
