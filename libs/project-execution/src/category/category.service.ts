import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { CategoryData } from '../interfaces';
import { handleException } from '@login/login/utils';
import { AuditActionType } from '@prisma/client';
import { DeleteCategoriesDto } from './dto/delete-category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva categoría
   * @param createCategoryDto Datos de la categoría a crear
   * @param user Usuario que realiza la acción
   * @returns Categoría creada
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    user: UserData,
  ): Promise<HttpResponse<CategoryData>> {
    const { name } = createCategoryDto;
    let newCategory;

    try {
      // Crear la categoría y registrar la auditoría
      await this.findByName(name);
      newCategory = await this.prisma.$transaction(async () => {
        // Crear la nueva categoría
        const category = await this.prisma.category.create({
          data: {
            name,
          },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        });

        // Registrar la auditoría de la creación de la categoria
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: category.id,
            entityType: 'category',
            performedById: user.id,
          },
        });

        return category;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Category created successfully',
        data: {
          id: newCategory.id,
          name: newCategory.name,
          isActive: newCategory.isActive,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating category: ${error.message}`,
        error.stack,
      );

      if (newCategory) {
        await this.prisma.category.delete({ where: { id: newCategory.id } });
        this.logger.error(
          `Category has been deleted due to error in creation.`,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a category');
    }
  }

  /**
   * Obtiene todas las categorías
   * @param user Usuario que realiza la acción
   * @returns Categorías
   */
  async findAll(user: UserPayload): Promise<CategoryData[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo CategoryData
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        isActive: category.isActive,
      })) as CategoryData[];
    } catch (error) {
      this.logger.error('Error getting all categories');
      handleException(error, 'Error getting all categories');
    }
  }

  /**
   * Obtiene una categoría por identificador
   * @param id Identificador de la categoría
   * @returns Categoría
   */
  async findOne(id: string): Promise<CategoryData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get category');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get category');
    }
  }

  /**
   * Busca una categoría por identificador
   * @param id Identificador de la categoría
   * @returns Categoría
   */
  async findById(id: string): Promise<CategoryData> {
    const categoryDb = await this.prisma.category.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
    if (!categoryDb) {
      throw new BadRequestException('This category doesnt exist');
    }

    if (!!categoryDb && !categoryDb.isActive) {
      throw new BadRequestException('This category exist, but is inactive');
    }

    return categoryDb;
  }

  /**
   * Busca una categoría por nombre
   * @param name Nombre de la categoría
   * @param id Identificador de la categoría
   * @returns Categoría
   */
  async findByName(name: string, id?: string): Promise<CategoryData> {
    const categoryDB = await this.prisma.category.findFirst({
      where: { name },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
    if (!!categoryDB && categoryDB.id !== id) {
      if (!!categoryDB && !categoryDB.isActive) {
        throw new BadRequestException('This category exists but is not active');
      }
      if (categoryDB) {
        throw new BadRequestException('This category already exists');
      }
    }

    return categoryDB;
  }

  /**
   * Actualiza una categoría
   * @param id Identificador de la categoría
   * @param updateCategoryDto Datos de la categoría a actualizar
   * @param user Usuario que realiza la acción
   * @returns Categoría actualizada
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    user: UserData,
  ): Promise<HttpResponse<CategoryData>> {
    const { name } = updateCategoryDto;

    try {
      const categoryDB = await this.findById(id);

      if (name) {
        await this.findByName(name, id);
      }

      // Validar si hay cambios
      const noChanges = name === undefined || name === categoryDB.name;

      if (noChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Category updated successfully',
          data: {
            id: categoryDB.id,
            name: categoryDB.name,
            isActive: categoryDB.isActive,
          },
        };
      }

      // Construir el objeto de actualización dinámicamente solo con los campos presentes
      const updateData: any = {};
      if (name !== undefined && name !== categoryDB.name)
        updateData.name = name;

      // Transacción para realizar la actualización
      const updatedCategory = await this.prisma.$transaction(async (prisma) => {
        const category = await prisma.category.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        });
        // Crear un registro de auditoría
        await prisma.audit.create({
          data: {
            entityId: category.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'category',
          },
        });

        return category;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Category updated successfully',
        data: updatedCategory,
      };
    } catch (error) {
      this.logger.error(
        `Error updating category: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a category');
    }
  }

  /**
   * Reactiva las categorías
   * @param user Usuario que realiza la acción
   * @param categories Categorías a reactivar
   * @returns Respuesta de la acción
   */
  async reactivateAll(
    user: UserData,
    categories: DeleteCategoriesDto,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar las categorías en la base de datos
        const categoriesDB = await prisma.category.findMany({
          where: {
            id: { in: categories.ids },
          },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        });

        // Validar que se encontraron las categorías
        if (categoriesDB.length === 0) {
          throw new NotFoundException('Category not found or inactive');
        }

        // Reactivar las categorías
        const reactivatePromises = categoriesDB.map(async (category) => {
          // Activar la categoría
          await prisma.category.update({
            where: { id: category.id },
            data: { isActive: true },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.UPDATE,
              entityId: category.id,
              entityType: 'category',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: category.id,
            name: category.name,
            isActive: category.isActive,
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Categories reactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error reactivating categories', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error reactivating categories');
    }
  }

  /**
   * Desactiva las categorías
   * @param categories Categorías a desactivar
   * @param user Usuario que realiza la acción
   * @returns Respuesta de la acción
   */
  async removeAll(
    categories: DeleteCategoriesDto,
    user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar las categorías en la base de datos
        const categoriesDB = await prisma.category.findMany({
          where: {
            id: { in: categories.ids },
          },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        });

        // Validar que se encontraron las categorías
        if (categoriesDB.length === 0) {
          throw new NotFoundException('Category not found or inactive');
        }

        const deactivatePromises = categoriesDB.map(async (categoryDelete) => {
          // Desactivar las categorías
          await prisma.category.update({
            where: { id: categoryDelete.id },
            data: { isActive: false },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.DELETE,
              entityId: categoryDelete.id,
              entityType: 'category',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: categoryDelete.id,
            name: categoryDelete.name,
            isActive: categoryDelete.isActive,
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Categories deactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error deactivating categories', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error deactivating categories');
    }
  }
}
