import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { handleException } from '@login/login/utils';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  /**
   * Crea un Business en la base de datos.
   * Solo puede existir 1 registro. Si se intenta crear
   * un segundo registro, lanza http 409
   * @param createBusinessDto El Business a crear
   * @param user Usuario que crea el usuario
   */
  async create(
    createBusinessDto: CreateBusinessDto,
    user: UserData,
  ): Promise<HttpResponse<undefined>> {
    try {
      const { name, ruc, address, legalRepName, legalRepDni } =
        createBusinessDto;

      this.prisma.$transaction(async (prisma) => {
        // Verificar que no existe ningun business
        const businessCount = await prisma.businessConfig.count();
        if (businessCount > 0) {
          throw new ConflictException('Attempted to create a second business');
        }

        // Crear el business
        const newBusiness = await prisma.businessConfig.create({
          data: {
            name,
            ruc,
            address,
            legalRepName,
            legalRepDni,
          },
        });

        // Registrar la accion en Audit
        await this.audit.create({
          entityId: newBusiness.id,
          entityType: 'user',
          action: AuditActionType.CREATE,
          performedById: user.id,
          createdAt: new Date(),
        });
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Business created',
        data: undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error creating business: ${createBusinessDto.name}`,
        error.stack,
      );
      if (error instanceof ConflictException) {
        throw error;
      }
      handleException(error, 'Error creating a user');
    }
  }

  /**
   * Devuelve los Business de la base de datos.
   * Si hay mas de 1 Business lanza http 500
   *
   * @returns Lista de Business
   */
  async findAll() {
    const businesses = await this.prisma.businessConfig.findMany();
    if (businesses.length > 1) {
      throw new InternalServerErrorException(
        'Found more than 1 Business record',
      );
    }

    return businesses;
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto) {
    return `This action updates a #${id} business`;
  }
}
