import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { PrismaService } from '@prisma/prisma';
import { handleException } from '@login/login/utils';
import { AuditActionType } from '@prisma/client';
import { DeleteSuppliersDto } from './dto/delete-supplier.dto';
import { SupplierData, SupplierDescriptionData } from '../interfaces';

@Injectable()
export class SupplierService {
  private readonly logger = new Logger(SupplierService.name);
  constructor(private readonly prisma: PrismaService) {}

  private validateLengthRuc(ruc: string): void {
    if (ruc.length !== 11) {
      throw new BadRequestException('The length of the RUC  is incorrect');
    }
  }

  /**
   * Crear un nuevo proveedor
   * @param createSupplierDto Datos del proveedor a crear
   * @param user Usuario que realiza la acción
   * @returns Datos del proveedor creado
   */
  async create(
    createSupplierDto: CreateSupplierDto,
    user: UserData,
  ): Promise<HttpResponse<SupplierData>> {
    const { name, address, phone, ruc, email, department, province } =
      createSupplierDto;
    let newSupplier;

    try {
      // Crear el proveedor y registrar la auditoría
      await this.findByRuc(ruc);
      await this.findByName(name);
      await this.findByEmail(email);
      await this.validateLengthRuc(ruc);
      newSupplier = await this.prisma.$transaction(async () => {
        // Crear el nuevo proveedor
        const supplier = await this.prisma.supplier.create({
          data: {
            name,
            address,
            phone,
            ruc,
            email,
            department,
            province,
          },
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            ruc: true,
            email: true,
            department: true,
            province: true,
            isActive: true,
          },
        });

        // Registrar la auditoría de la creación del proveedor
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: supplier.id,
            entityType: 'supplier',
            performedById: user.id,
          },
        });

        return supplier;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Supplier created successfully',
        data: {
          id: newSupplier.id,
          name: newSupplier.name,
          ruc: newSupplier.ruc,
          phone: newSupplier.phone,
          address: newSupplier.address,
          email: newSupplier.email,
          department: newSupplier.department,
          province: newSupplier.province,
          isActive: newSupplier.isActive,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating supplier: ${error.message}`,
        error.stack,
      );

      if (newSupplier) {
        await this.prisma.supplier.delete({ where: { id: newSupplier.id } });
        this.logger.error(
          `Supplier has been deleted due to error in creation.`,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a supplier');
    }
  }

  /**
   * Obtener todos los proveedores
   * @param user Usuario que realiza la acción
   * @returns Lista de proveedores
   */
  async findAll(user: UserPayload): Promise<SupplierDescriptionData[]> {
    try {
      const suppliers = await this.prisma.supplier.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          ruc: true,
          email: true,
          department: true,
          province: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo SupplierDescriptionData
      return suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        address: supplier.address,
        phone: supplier.phone,
        ruc: supplier.ruc,
        email: supplier.email,
        department: supplier.department,
        province: supplier.province,
        isActive: supplier.isActive,
        description: [supplier],
      })) as SupplierDescriptionData[];
    } catch (error) {
      this.logger.error('Error getting all suppliers');
      handleException(error, 'Error getting all suppliers');
    }
  }

  /**
   * Obtener un proveedor por ID
   * @param id ID del proveedor a buscar
   * @returns Datos del proveedor
   */
  async findOne(id: string): Promise<SupplierData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get supplier');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get supplier');
    }
  }

  /**
   * Validar que el RUC no esté en uso
   * @param ruc RUC a validar
   * @param id ID del proveedor a excluir de la búsqueda
   * @returns Datos del proveedor si existe
   */
  async findByRuc(ruc: string, id?: string): Promise<SupplierData> {
    const supplierDB = await this.prisma.supplier.findFirst({
      where: { ruc },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        ruc: true,
        email: true,
        department: true,
        province: true,
        isActive: true,
      },
    });

    if (!!supplierDB && supplierDB.id !== id) {
      if (!supplierDB.isActive) {
        throw new BadRequestException(
          'This supplier is inactive, contact the superadmin to reactivate it',
        );
      }
      if (ruc.length === 11) {
        throw new BadRequestException('This RUC is already in use');
      }
    }

    return supplierDB;
  }

  /**
   * Validar que el nombre no esté en uso
   * @param name Nombre a validar
   * @param id ID del proveedor a excluir de la búsqueda
   * @returns Datos del proveedor si existe
   */
  async findByName(name: string, id?: string): Promise<SupplierData> {
    const supplierDB = await this.prisma.supplier.findFirst({
      where: { name },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        ruc: true,
        email: true,
        department: true,
        province: true,
        isActive: true,
      },
    });
    if (!!supplierDB && supplierDB.id !== id) {
      if (!!supplierDB && !supplierDB.isActive) {
        throw new BadRequestException(
          'This name is already in use by an inactive supplier',
        );
      }
      if (supplierDB) {
        throw new BadRequestException('This name is already in use');
      }
    }

    return supplierDB;
  }

  /**
   * Validar que el email no esté en uso
   * @param email Email a validar
   * @param id ID del proveedor a excluir de la búsqueda
   * @returns Datos del proveedor si existe
   */
  async findByEmail(email: string, id?: string): Promise<SupplierData> {
    const supplierDB = await this.prisma.supplier.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        ruc: true,
        email: true,
        department: true,
        province: true,
        isActive: true,
      },
    });
    if (!!supplierDB && supplierDB.id !== id) {
      if (!!supplierDB && !supplierDB.isActive) {
        throw new BadRequestException(
          'This email is already in use by an inactive supplier',
        );
      }
      if (supplierDB) {
        throw new BadRequestException('This email is already in use');
      }
    }

    return supplierDB;
  }

  /**
   * Mostrar los datos de un proveedor con validaciones
   * @param id ID del proveedor a buscar
   * @returns Datos del proveedor
   */
  async findById(id: string): Promise<SupplierData> {
    const supplierDb = await this.prisma.supplier.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        ruc: true,
        email: true,
        department: true,
        province: true,
        isActive: true,
      },
    });
    if (!supplierDb) {
      throw new BadRequestException('This supplier doesnt exist');
    }

    if (!!supplierDb && !supplierDb.isActive) {
      throw new BadRequestException('This supplier exist, but is inactive');
    }

    return supplierDb;
  }

  /**
   * Actualizar un proveedor
   * @param id ID del proveedor a actualizar
   * @param updateSupplierDto Datos del proveedor a actualizar
   * @param user Usuario que realiza la acción
   * @returns Datos del proveedor actualizado
   */
  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    user: UserData,
  ): Promise<HttpResponse<SupplierData>> {
    const { name, phone, address, email, ruc, department, province } =
      updateSupplierDto;

    try {
      const supplierDB = await this.findById(id);

      if (ruc) {
        await this.validateLengthRuc(ruc);
        await this.findByRuc(ruc, id);
      }
      if (name) {
        await this.findByName(name, id);
      }
      if (email) {
        await this.findByEmail(email, id);
      }

      // Validar si hay cambios
      const noChanges =
        (name === undefined || name === supplierDB.name) &&
        (phone === undefined || phone === supplierDB.phone) &&
        (ruc === undefined || ruc === supplierDB.ruc) &&
        (address === undefined || address === supplierDB.address) &&
        (email === undefined || email === supplierDB.email) &&
        (department === undefined || department === supplierDB.department) &&
        (province === undefined || province === supplierDB.province);

      if (noChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Supplier updated successfully',
          data: {
            id: supplierDB.id,
            name: supplierDB.name,
            address: supplierDB.address,
            phone: supplierDB.phone,
            ruc: supplierDB.ruc,
            email: supplierDB.email,
            department: supplierDB.department,
            province: supplierDB.province,
            isActive: supplierDB.isActive,
          },
        };
      }

      // Construir el objeto de actualización dinámicamente solo con los campos presentes
      const updateData: any = {};
      if (name !== undefined && name !== supplierDB.name)
        updateData.name = name;
      if (phone !== undefined && phone !== supplierDB.phone)
        updateData.phone = phone;
      if (ruc !== undefined && ruc !== supplierDB.ruc) updateData.ruc = ruc;
      if (address !== undefined && address !== supplierDB.address)
        updateData.address = address;
      if (email !== undefined && email !== supplierDB.email)
        updateData.email = email;
      if (department !== undefined && department !== supplierDB.department)
        updateData.department = department;
      if (province !== undefined && province !== supplierDB.province)
        updateData.province = province;
      // Transacción para realizar la actualización
      const updatedSupplier = await this.prisma.$transaction(async (prisma) => {
        const supplier = await prisma.supplier.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            ruc: true,
            email: true,
            department: true,
            province: true,
            isActive: true,
          },
        });
        // Crear un registro de auditoría
        await prisma.audit.create({
          data: {
            entityId: supplier.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'supplier',
          },
        });

        return supplier;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Supplier updated successfully',
        data: updatedSupplier,
      };
    } catch (error) {
      this.logger.error(
        `Error updating supplier: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a supplier');
    }
  }

  /**
   * Reactivar varios proveedores
   * @param user Usuario que realiza la acción
   * @param suppliers Proveedores a reactivar
   * @returns Respuesta de la operación
   */
  async reactivateAll(
    user: UserData,
    suppliers: DeleteSuppliersDto,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los proveedores en la base de datos
        const suppliersDB = await prisma.supplier.findMany({
          where: {
            id: { in: suppliers.ids },
          },
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            ruc: true,
            email: true,
            isActive: true,
          },
        });

        // Validar que se encontraron los proveedores
        if (suppliersDB.length === 0) {
          throw new NotFoundException('Supplier not found or inactive');
        }

        // Reactivar proveedores
        const reactivatePromises = suppliersDB.map(async (supplier) => {
          // Activar el proveedor
          await prisma.supplier.update({
            where: { id: supplier.id },
            data: { isActive: true },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.UPDATE,
              entityId: supplier.id,
              entityType: 'supplier',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: supplier.id,
            name: supplier.name,
            ruc: supplier.ruc,
            phone: supplier.phone,
            address: supplier.address,
            email: supplier.email,
            isActive: supplier.isActive,
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Suppliers reactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error reactivating suppliers', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error reactivating suppliers');
    }
  }

  /**
   * Desactivar varios proveedores
   * @param suppliers Proveedores a desactivar
   * @param user Usuario que realiza la acción
   * @returns Respuesta de la operación
   */
  async removeAll(
    suppliers: DeleteSuppliersDto,
    user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los proveedores en la base de datos
        const suppliersDB = await prisma.supplier.findMany({
          where: {
            id: { in: suppliers.ids },
          },
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            ruc: true,
            email: true,
            isActive: true,
          },
        });

        // Validar que se encontraron los proveedores
        if (suppliersDB.length === 0) {
          throw new NotFoundException('Suppliers not found or inactive');
        }

        const deactivatePromises = suppliersDB.map(async (supplierDelete) => {
          // Desactivar proveedores
          await prisma.supplier.update({
            where: { id: supplierDelete.id },
            data: { isActive: false },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.DELETE,
              entityId: supplierDelete.id,
              entityType: 'supplier',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: supplierDelete.id,
            name: supplierDelete.name,
            ruc: supplierDelete.ruc,
            phone: supplierDelete.phone,
            address: supplierDelete.address,
            email: supplierDelete.email,
            isActive: supplierDelete.isActive,
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Suppliers deactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error deactivating suppliers', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error deactivating suppliers');
    }
  }
}
