import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { handleException } from '@login/login/utils';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ResourceData } from '../interfaces';
import { CreateResourceDto } from './dto/create-resource.dto';
import { PrismaService } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';
import { ResourceType } from '@prisma/client';
import { DeleteResourcesDto } from './dto/delete-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourceService {
  private readonly logger = new Logger(ResourceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Valida si ya existe un recurso con el mismo nombre y tipo.
   * @param name - Nombre del recurso a validar
   * @param type - Tipo del recurso a validar
   * @param id - ID del recurso (opcional, para validación en updates)
   * @throws BadRequestException si ya existe un recurso con ese nombre y tipo
   * @returns El recurso encontrado o null
   */
  private async findByNameAndType(
    name: string,
    type: ResourceType,
    id?: string,
  ): Promise<ResourceData | null> {
    const resourceDB = await this.prisma.resource.findFirst({
      where: {
        name,
        type,
        ...(id && { id: { not: id } }),
      },
      select: {
        id: true,
        type: true,
        name: true,
        unit: true,
        unitCost: true,
        isActive: true,
      },
    });

    if (resourceDB) {
      if (!resourceDB.isActive) {
        throw new BadRequestException(
          `This resource with name "${name}" and type "${type}" is inactive, contact the superadmin to reactivate it`,
        );
      }
      throw new BadRequestException(`Resource already exists`);
    }

    return resourceDB;
  }

  /**
   * Valida si un DTO tiene cambios significativos comparando con los datos existentes
   * @param dto DTO con los cambios propuestos
   * @param currentData Objeto actual desde la base de datos
   * @return verdadero si hay cambios , falso si no hay cambios
   */
  private validateChanges<T extends object>(
    dto: Partial<T>,
    currentData: T,
  ): boolean {
    // Verifica si todos los campos son undefined o null
    const hasValidValues = Object.values(dto).some(
      (value) => value !== undefined && value !== null,
    );

    if (!hasValidValues) {
      return false;
    }

    // Verifica si hay cambios reales comparando con los datos actuales
    let hasChanges = false;
    for (const [key, newValue] of Object.entries(dto)) {
      // Solo compara si el campo está presente en el DTO y no es undefined
      if (newValue !== undefined && key in currentData) {
        const currentValue = currentData[key];
        // Compara los valores y marca si hay algún cambio
        if (newValue !== currentValue) {
          hasChanges = true;
          break;
        }
      }
    }

    return hasChanges;
  }

  /**
   * Crea un nuevo recurso
   * @param createResourceDto - Datos del recurso a crear
   * @param user - Usuario que realiza la acción
   * @returns Datos del recurso creado
   * @throws {BadRequestException} Si hay error en la validación de datos
   */
  async create(
    createResourceDto: CreateResourceDto,
    user: UserData,
  ): Promise<HttpResponse<ResourceData>> {
    const { type, name, unit, unitCost } = createResourceDto;
    let newResource: ResourceData | null = null;

    try {
      // Validar que el nombre no exista
      await this.findByNameAndType(name, type);

      newResource = await this.prisma.$transaction(async () => {
        // Crear el nuevo recurso
        const resource = await this.prisma.resource.create({
          data: {
            type,
            name,
            unit,
            unitCost,
          },
          select: {
            id: true,
            type: true,
            name: true,
            unit: true,
            unitCost: true,
            isActive: true,
          },
        });

        // Registrar la auditoría de la creación del recurso
        await this.audit.create({
          entityId: resource.id,
          entityType: 'resource',
          action: 'CREATE',
          performedById: user.id,
          createdAt: new Date(),
        });

        return resource;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Resource created successfully',
        data: newResource,
      };
    } catch (error) {
      this.logger.error(
        `Error creating resource: ${error.message}`,
        error.stack,
      );

      if (newResource?.id) {
        await this.prisma.resource.delete({ where: { id: newResource.id } });
        this.logger.error(
          `Resource has been deleted due to error in creation.`,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a resource');
    }
  }

  /**
   * Actualiza un recurso existente.
   * Verifica que no exista otro recurso con el mismo nombre y tipo.
   *
   * @param id - ID del recurso a actualizar
   * @param updateResourceDto - Datos a actualizar del recurso
   * @param user - Usuario que realiza la acción
   * @returns - Datos del recurso actualizado
   * @throws {BadRequestException} - Si el nombre y tipo ya existen para otro recurso
   * @throws {NotFoundException} - Si el recurso no existe
   */
  async update(
    id: string,
    updateResourceDto: UpdateResourceDto,
    user: UserData,
  ): Promise<HttpResponse<ResourceData>> {
    const { name, type, unit, unitCost } = updateResourceDto;

    try {
      const currentResource = await this.findById(id);

      // Validar cambios comparando con los datos actuales
      const hasChange = this.validateChanges(
        updateResourceDto,
        currentResource,
      );

      if (!hasChange) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Resource updated successfully',
          data: currentResource,
        };
      }

      // Verificar que no exista otro recurso con el mismo nombre y tipo
      const existingResource = await this.findByNameAndType(name, type, id);
      if (existingResource) {
        throw new BadRequestException(
          'Resource with the same name and type already exists',
        );
      }

      const updatedResource = await this.prisma.$transaction(async (prisma) => {
        // Actualizar el recurso
        const resource = await prisma.resource.update({
          where: { id },
          data: {
            name,
            type,
            unit,
            unitCost,
          },
          select: {
            id: true,
            type: true,
            name: true,
            unit: true,
            unitCost: true,
            isActive: true,
          },
        });

        // Registrar la auditoría de la actualización del recurso
        await this.audit.create({
          entityId: resource.id,
          entityType: 'resource',
          action: 'UPDATE',
          performedById: user.id,
          createdAt: new Date(),
        });

        return resource;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Resource updated successfully',
        data: updatedResource,
      };
    } catch (error) {
      this.logger.error(
        `Error updating resource: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating resource');
    }
  }

  /**
   * Obtiene los recursos filtrados por tipo.
   * Los superadmins ven todos los recursos incluyendo los inactivos,
   * los usuarios normales solo ven recursos activos.
   *
   * @param type - Tipo de recurso a buscar (TOOLS, LABOR, SUPPLIES, SERVICES)
   * @param user - Usuario que realiza la petición
   * @returns Lista de recursos del tipo especificado
   */
  async findByType(
    type: ResourceType,
    user: UserPayload,
  ): Promise<ResourceData[]> {
    try {
      // Validar que el tipo sea uno de los valores permitidos
      if (!Object.values(ResourceType).includes(type)) {
        throw new BadRequestException(
          `Invalid resource type. Must be one of: ${Object.values(
            ResourceType,
          ).join(', ')}`,
        );
      }
      const resources = await this.prisma.resource.findMany({
        where: {
          type,
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
        },
        select: {
          id: true,
          type: true,
          name: true,
          unit: true,
          unitCost: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return resources;
    } catch (error) {
      this.logger.error(
        `Error retrieving resource: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error retrieving resources ');
    }
  }

  /**
   * Busca un recurso por su ID.
   * @param id - ID del recurso a buscar
   * @returns - Datos del recurso encontrado
   * @throws {NotFoundException} - Si el recurso no existe
   */
  async findById(id: string): Promise<ResourceData> {
    const resourceDB = await this.prisma.resource.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        name: true,
        unit: true,
        unitCost: true,
        isActive: true,
      },
    });

    if (!resourceDB) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resourceDB;
  }

  /**
   * Busca un recurso por su ID.
   * @param id - ID del recurso a buscar
   * @returns - Datos del recurso encontrado
   * @throws {NotFoundException} - Si el recurso no existe
   */
  async findOne(id: string): Promise<ResourceData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error(
        `Error retrieving resource: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error retrieving resource');
    }
  }

  /**
   * Desactiva múltiples recursos (cambia isActive a false)
   * @param ids - Array con los IDs de los recursos a desactivar
   * @param user - Usuario que realiza la acción
   * @returns Mensaje de confirmación
   * @throws {NotFoundException} Si algún recurso no existe
   * @throws {BadRequestException} Si hay error en la validación
   */
  async removeAll(
    deleteResourcesDto: DeleteResourcesDto,
    user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los recursos en la base de datos
        const resourcesDB = await prisma.resource.findMany({
          where: {
            id: { in: deleteResourcesDto.ids },
          },
          select: {
            id: true,
            type: true,
            name: true,
            unit: true,
            unitCost: true,
            isActive: true,
          },
        });

        // Validar que se encontraron los recursos
        if (resourcesDB.length === 0) {
          throw new NotFoundException('Resources not found');
        }

        // Validar que los recursos existan
        if (resourcesDB.length !== deleteResourcesDto.ids.length) {
          throw new NotFoundException('Some resources were not found');
        }

        // Desactivar recursos
        const deactivatePromises = resourcesDB.map(async (resource) => {
          // Desactivar el recurso
          await prisma.resource.update({
            where: { id: resource.id },
            data: { isActive: false },
          });

          // Registrar en auditoría
          await this.audit.create({
            entityId: resource.id,
            entityType: 'resource',
            action: 'DELETE',
            performedById: user.id,
            createdAt: new Date(),
          });

          return {
            id: resource.id,
            type: resource.type,
            name: resource.name,
            unit: resource.unit,
            unitCost: resource.unitCost,
            isActive: resource.isActive,
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Resources deactivated successfully',
      };
    } catch (error) {
      this.logger.error('Error deactivating resources', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error deactivating resources');
    }
  }

  /**
   * Reactiva múltiples recursos (cambia isActive a true)
   * @param ids - Array con los IDs de los recursos a reactivar
   * @param user - Usuario que realiza la acción
   * @returns Mensaje de confirmación
   * @throws {NotFoundException} Si algún recurso no existe
   * @throws {BadRequestException} Si hay error en la validación
   */
  async reactivateAll(
    user: UserData,
    deleteResourcesDto: DeleteResourcesDto,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los recursos en la base de datos
        const resourcesDB = await prisma.resource.findMany({
          where: {
            id: { in: deleteResourcesDto.ids },
          },
          select: {
            id: true,
            type: true,
            name: true,
            unit: true,
            unitCost: true,
            isActive: true,
          },
        });

        // Validar que se encontraron los recursos
        if (resourcesDB.length === 0) {
          throw new NotFoundException('Resources not found');
        }

        // Validar que los recursos existan
        if (resourcesDB.length !== deleteResourcesDto.ids.length) {
          throw new NotFoundException('Some resources were not found');
        }

        // Reactivar recursos
        const reactivatePromises = resourcesDB.map(async (resource) => {
          // Activar el recurso
          await prisma.resource.update({
            where: { id: resource.id },
            data: { isActive: true },
          });

          // Registrar en auditoría
          await this.audit.create({
            entityId: resource.id,
            entityType: 'resource',
            action: 'UPDATE',
            performedById: user.id,
            createdAt: new Date(),
          });

          return {
            id: resource.id,
            type: resource.type,
            name: resource.name,
            unit: resource.unit,
            unitCost: resource.unitCost,
            isActive: resource.isActive,
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Resources reactivated successfully',
      };
    } catch (error) {
      this.logger.error('Error reactivating resources', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error reactivating resources');
    }
  }
}
