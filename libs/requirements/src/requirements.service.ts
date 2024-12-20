import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { HttpResponse, UserData } from '@login/login/interfaces';
import {
  UpdateRequirements,
  RequirementsData,
  UpdateRequirementsDetail,
} from './requirement.interface';
import { AuditActionType, RequirementDetailStatus } from '@prisma/client';
import { handleException } from '@login/login/utils';
import {
  UpdateRequirementDetailDto,
  UpdateRequirementDto,
} from './dto/update-requirement.dto';
import { UsersService } from '@login/login/admin/users/users.service';
import { ExecutionProjectService } from '@project-execution/project-execution/project/project.service';

@Injectable()
export class RequirementService {
  private readonly logger = new Logger(RequirementService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly user: UsersService,
    private readonly executionProjectService: ExecutionProjectService,
  ) {}

  /**
   * Crear un nuevo requerimiento
   * @param createRequirementDto Datos del requerimiento a crear
   * @param user Usuario que realiza la acción
   * @returns Respuesta de la creación
   */
  async create(
    createRequirementDto: CreateRequirementDto,
    user: UserData,
  ): Promise<HttpResponse<RequirementsData>> {
    const { date, residentId, executionProyectId, requirementsDetail } =
      createRequirementDto;

    try {
      // Verificando que el proyecto de ejecución existe
      await this.executionProjectService.findById(executionProyectId);

      // Verificando que el residente existe y está activo
      const userResidentDb = await this.user.findById(residentId);
      if (!userResidentDb.isActive)
        throw new NotFoundException(`This user exist, but is inactive`);

      // Verificando si el residente es superAdmin
      if (userResidentDb.isSuperAdmin)
        throw new NotFoundException('Resident is super admin');

      // Creando el requerimiento principal
      const requirementDb = await this.prisma.requirements.create({
        data: {
          date,
          residentId,
          executionProyectId,
        },
        select: {
          id: true,
          date: true,
        },
      });

      // Crear los detalles de requerimiento
      const createdDetails = await Promise.all(
        requirementsDetail.map(async (detail) => {
          const { quantity, dateDetail, description, resourceId } = detail;

          // Validando que el recurso exista
          const resource = await this.prisma.resource.findUnique({
            where: { id: resourceId },
            select: { id: true, name: true, unit: true, type: true },
          });

          if (!resource) throw new Error(`Resource not found`);

          // Validando que el recurso dea del tipo SUPLLIES
          if (resource.type !== 'SUPPLIES') {
            throw new BadRequestException('Resource is not of type SUPPLIES');
          }

          // Creando el detalle de requerimiento
          const requirementDetail = await this.prisma.requirementsDetail.create(
            {
              data: {
                quantity,
                dateDetail,
                description,
                requirementsId: requirementDb.id,
                resourceId: resource.id,
              },
            },
          );

          // Devolviendo el detalle de requerimiento con el recurso asociado
          return {
            id: requirementDetail.id,
            status: requirementDetail.status,
            quantity: requirementDetail.quantity,
            dateDetail: requirementDetail.dateDetail,
            description: requirementDetail.description,
            resourceId: resource.id,
            resource: {
              id: resource.id,
              name: resource.name,
              unit: resource.unit,
            },
          };
        }),
      );

      // Registrar la auditoría de la creación del requerimiento
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.CREATE,
          entityId: requirementDb.id,
          entityType: 'requirement',
          performedById: user.id,
        },
      });

      // Respuesta
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Requirement created successfully',
        data: {
          id: requirementDb.id,
          date: requirementDb.date,
          resident: { id: residentId, name: 'Resident Name' },
          executionProject: { id: executionProyectId, name: 'Project Name' },
          requirementDetail: createdDetails,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating requirement: ${error.message}`,
        error.stack,
      );
      handleException(error, 'Error creating a requirement');
    }
  }

  /**
   * Listar todos los requerimientos
   * @returns Requerimientos encontrados
   */
  async findAll(): Promise<HttpResponse<RequirementsData[]>> {
    try {
      // Recuperamos todos los requerimientos con sus detalles asociados
      const requirements = await this.prisma.requirements.findMany({
        select: {
          id: true,
          date: true,
          residentId: true,
          executionProyectId: true,
          createdAt: true,
          updatedAt: true,
          resident: {
            select: {
              id: true,
              name: true,
            },
          },
          executionProject: {
            select: {
              id: true,
              name: true,
            },
          },
          requirementsDetail: {
            // Detalles de cada requerimiento
            select: {
              id: true,
              status: true,
              quantity: true,
              dateDetail: true,
              description: true,
              resource: {
                // Información sobre el recurso relacionado con el detalle
                select: {
                  id: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      // Respuesta si no se encuentran requerimientos
      if (requirements.length === 0) {
        return {
          statusCode: HttpStatus.NO_CONTENT,
          message: 'No requirements found',
          data: [],
        };
      }

      // Mapear los resultados para que coincidan con la estructura de 'RequirementsData'
      const mappedRequirements = requirements.map((requirement) => ({
        id: requirement.id,
        date: requirement.date,
        resident: requirement.resident,
        executionProject: requirement.executionProject,
        requirementDetail: requirement.requirementsDetail.map((detail) => ({
          id: detail.id,
          status: detail.status,
          quantity: detail.quantity,
          dateDetail: detail.dateDetail,
          description: detail.description,
          resourceId: detail.resource.id,
        })),
      }));

      // Devolvemos los datos con los requerimientos encontrados
      return {
        statusCode: HttpStatus.OK,
        message: 'Requirements fetched successfully',
        data: mappedRequirements, // Ahora con el formato correcto
      };
    } catch (error) {
      this.logger.error(
        `Error fetching requirements: ${error.message}`,
        error.stack,
      );
      handleException(error, 'Error fetching requirements');
    }
  }

  /**
   * Mostrar un requerimiento específico con validación de existencia
   * @param id Id del requerimiento a buscar
   * @returns Datos del requerimiento encontrado
   */
  async findById(id: string): Promise<RequirementsData> {
    const requirementDb = await this.prisma.requirements.findFirst({
      where: { id },
      select: {
        id: true,
        date: true,
        resident: {
          select: {
            id: true,
            name: true,
          },
        },
        executionProject: {
          select: {
            id: true,
            name: true,
          },
        },
        requirementsDetail: {
          select: {
            id: true,
            status: true,
            quantity: true,
            dateDetail: true,
            description: true,
            resource: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!requirementDb) {
      throw new NotFoundException('Requirement not found');
    }
    return requirementDb;
  }

  /**
   * Actualizar un requerimiento
   * @param id Id del requerimiento a actualizar
   * @param updateRequirementDto Datos a actualizar
   * @param user Usuario que realiza la acción
   * @returns Respuesta de la actualización
   */
  async updateRequirement(
    id: string,
    updateRequirementDto: UpdateRequirementDto,
    user: UserData,
  ): Promise<HttpResponse<UpdateRequirements>> {
    const { date, residentId } = updateRequirementDto;

    // Verificar si el requerimiento existe
    const existingRequirement = await this.findById(id);

    const userResidentDb = await this.user.findById(residentId);
    // Verificando si el residente es superAdmin
    if (userResidentDb.isSuperAdmin)
      throw new NotFoundException('Resident is super admin');

    // Verificar si hay cambios válidos
    const isDateChanged = date && date !== existingRequirement.date;
    const isResidentChanged =
      residentId && residentId !== existingRequirement.resident.id;

    if (!isDateChanged && !isResidentChanged) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Requirement updated successfully',
        data: existingRequirement,
      };
    }

    // Actualizar solo los campos que han cambiado
    const updatedRequirement = await this.prisma.requirements.update({
      where: { id },
      data: {
        date: isDateChanged ? date : existingRequirement.date,
        residentId: isResidentChanged
          ? residentId
          : existingRequirement.resident.id,
      },
    });

    // Registrar la auditoría
    await this.prisma.audit.create({
      data: {
        action: AuditActionType.UPDATE,
        entityId: updatedRequirement.id,
        entityType: 'requirement',
        performedById: user.id,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Requirement updated successfully',
      data: {
        id: updatedRequirement.id,
        date: updatedRequirement.date,
        resident: {
          id: updatedRequirement.residentId,
          name: 'Resident Name',
        },
      },
    };
  }

  async updateRequirementDetails(
    id: string,
    updateRequirementDto: UpdateRequirementDetailDto,
    user: UserData,
  ): Promise<HttpResponse<UpdateRequirementsDetail>> {
    const { quantity, dateDetail, description, resourceId } =
      updateRequirementDto;

    // Verificar si el detalle del requerimiento existe
    const existingDetail = await this.prisma.requirementsDetail.findUnique({
      where: { id },
      include: { resource: true },
    });

    if (!existingDetail) {
      throw new NotFoundException(`Requirement detail not found`);
    }

    // Validar si se recibe un nuevo resourceId
    if (resourceId && resourceId !== existingDetail.resourceId) {
      const resource = await this.prisma.resource.findUnique({
        where: { id: resourceId },
        select: { id: true, name: true, unit: true, type: true },
      });

      if (!resource) throw new NotFoundException('Resource not found');

      if (resource.type !== 'SUPPLIES')
        throw new BadRequestException('Resource is not of type SUPPLIES');
    }

    // Verificar si hay cambios
    const isDetailChanged =
      quantity !== existingDetail.quantity ||
      dateDetail !== existingDetail.dateDetail ||
      description !== existingDetail.description;

    if (!isDetailChanged) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Requirement detail updated successfully',
        data: existingDetail,
      };
    }

    // Actualizar el detalle del requerimiento
    const updatedDetail = await this.prisma.requirementsDetail.update({
      where: { id },
      data: {
        quantity,
        dateDetail,
        description,
        resourceId,
      },
    });

    // Registrar auditoría
    await this.prisma.audit.create({
      data: {
        action: AuditActionType.UPDATE,
        entityId: id,
        entityType: 'requirementDetail',
        performedById: user.id,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Requirement detail updated successfully',
      data: updatedDetail,
    };
  }

  /**
   * Actualizar el estado de un detalle de requerimiento
   * @param detailId Id del detalle de requerimiento
   * @param newStatus Nuevo estado a asignar
   * @param userId Id del usuario que realiza la acción
   * @returns Respuesta de la actualización
   */
  async updateStatus(
    detailId: string,
    newStatus: RequirementDetailStatus,
    userId: string,
  ) {
    // Verificar si el detalle existe
    const existingDetail = await this.prisma.requirementsDetail.findUnique({
      where: { id: detailId },
    });

    if (!existingDetail) {
      throw new NotFoundException(`Requirement detail not found`);
    }

    // Verificar si el estado actual es diferente al nuevo estado
    if (existingDetail.status === newStatus) {
      return {
        statusCode: HttpStatus.OK,
        message: 'The status is already the same, no changes made.',
      };
    }

    // Actualizar el estado del detalle
    const updatedDetail = await this.prisma.requirementsDetail.update({
      where: { id: detailId },
      data: { status: newStatus },
    });

    // Registrar auditoría
    await this.prisma.audit.create({
      data: {
        action: AuditActionType.UPDATE,
        entityId: updatedDetail.id,
        entityType: 'requirement_detail',
        performedById: userId,
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Requirement detail status updated successfully',
      data: updatedDetail,
    };
  }
}
