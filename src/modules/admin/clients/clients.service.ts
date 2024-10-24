import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { handleException } from '@login/login/utils';
import { ClientData } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private validateLengthDniRuc(dniRuc: string): void {
    if (dniRuc.length !== 8 && dniRuc.length !== 11) {
      throw new BadRequestException(
        'The length of the RUC or DNI is incorrect',
      );
    }
  }
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
      await this.findByRucDni(rucDni);
      await this.validateLengthDniRuc(rucDni);
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

  /**
   * Obtener todos los clientes
   * @param user Usuario que realiza la acción
   * @returns Lista de clientes
   */
  async findAll(user: UserPayload): Promise<ClientData[]> {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
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
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo ClientData
      return clients.map((client) => ({
        id: client.id,
        name: client.name,
        rucDni: client.rucDni,
        phone: client.phone,
        address: client.address,
        province: client.province,
        department: client.department,
        isActive: client.isActive,
      })) as ClientData[];
    } catch (error) {
      this.logger.error('Error getting all clients');
      handleException(error, 'Error getting all clients');
    }
  }

  /**
   * Buscar un cliente por su ID
   * @param id ID del cliente a buscar
   * @returns Cliente encontrado
   */
  async findOne(id: string): Promise<ClientData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get client');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get client');
    }
  }

  /**
   * Buscar un cliente por su RUC o DNI
   * @param rucDni RUC o DNI del cliente a buscar
   * @returns Cliente encontrado
   */
  async findByRucDni(rucDni: string): Promise<ClientData> {
    const clientDB = await this.prisma.client.findFirst({
      where: { rucDni },
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

    if (!!clientDB && !clientDB.isActive) {
      throw new BadRequestException(
        'This client is inactive, contact the superadmin to reactivate it',
      );
    }
    if (clientDB) {
      throw new BadRequestException('This client exists');
    }

    return clientDB;
  }

  /**
   * Buscar un cliente por su ID
   * @param id ID del cliente a buscar
   * @returns Cliente encontrado
   */
  async findById(id: string): Promise<ClientData> {
    const clientDb = await this.prisma.client.findFirst({
      where: { id },
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
    if (!clientDb) {
      throw new BadRequestException('This client doesnt exist');
    }

    if (!!clientDb && !clientDb.isActive) {
      throw new BadRequestException('This client exist, but is inactive');
    }

    return clientDb;
  }

  update(id: number, updateClientDto: UpdateClientDto) {
    return `This action updates a #${id} client`;
  }

  remove(id: number) {
    return `This action removes a #${id} client`;
  }
}
