import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { handleException } from '@login/login/utils';
import { ClientData } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo cliente
   * @param createClientDto Dto con los datos del cliente a crear
   * @param user Usuario que realiza la acción
   * @returns Nuevo cliente creado
   */
  async create(
    createClientDto: CreateClientDto,
    user: UserData,
  ): Promise<HttpResponse<ClientData>> {
    const { name, address, phone, rucDni, province, department } =
      createClientDto;
    let newClient;

    try {
      // Crear el cliente y registrar la auditoría
      newClient = await this.prisma.$transaction(async () => {
        // Crear el nuevo cliente
        const client = await this.prisma.client.create({
          data: {
            name,
            address,
            phone,
            rucDni,
            province,
            department,
          },
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            rucDni: true,
            province: true,
            department: true,
            isActive: true,
          },
        });

        // Registrar la auditoría de la creación del cliente
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: client.id,
            entityType: 'client',
            performedById: user.id,
          },
        });

        return client;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Client created successfully',
        data: {
          id: newClient.id,
          name: newClient.name,
          rucDni: newClient.rucDni,
          phone: newClient.phone,
          address: newClient.address,
          province: newClient.province,
          department: newClient.department,
          isActive: newClient.isActive,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating client: ${error.message}`, error.stack);

      if (newClient) {
        await this.prisma.client.delete({ where: { id: newClient.id } });
        this.logger.error(`Client has been deleted due to error in creation.`);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a client');
    }
  }

  findAll() {
    return `This action returns all clients`;
  }

  findOne(id: number) {
    return `This action returns a #${id} client`;
  }

  update(id: number, updateClientDto: UpdateClientDto) {
    return `This action updates a #${id} client`;
  }

  remove(id: number) {
    return `This action removes a #${id} client`;
  }
}
