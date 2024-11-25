import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { PrismaService } from '@prisma/prisma';
import { CategoryService } from '../category/category.service';
import { handleException } from '@login/login/utils';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { SubcategoryData } from '../interfaces';
import { AuditActionType } from '@prisma/client';
import { DeleteSubcategoriesDto } from './dto/delete-subcategory.dto';

@Injectable()
export class SubcategoryService {
  private readonly logger = new Logger(SubcategoryService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CategoryService))
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Crea una nueva subcategoria
   * @param createSubcategoryDto Datos de la subcategoria a crear
   * @param user Usuario que realiza la petición
   * @returns SubcategoryData
   */
  async create(
    createSubcategoryDto: CreateSubcategoryDto,
    user: UserData,
  ): Promise<HttpResponse<SubcategoryData>> {
    const { name, categoryId } = createSubcategoryDto;
    let newSubcategory;

    try {
      // Crear la subcategoria y registrar la auditoría
      await this.findByName(name);
      await this.categoryService.findById(categoryId);
      newSubcategory = await this.prisma.$transaction(async () => {
        // Crear la nueva subcategoria
        const subcategory = await this.prisma.subcategory.create({
          data: {
            name,
            category: {
              connect: {
                id: categoryId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            isActive: true,
          },
        });

        // Registrar la auditoría de la creación de la subcategoria
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: subcategory.id,
            entityType: 'subcategory',
            performedById: user.id,
          },
        });

        return subcategory;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Category created successfully',
        data: {
          id: newSubcategory.id,
          name: newSubcategory.name,
          isActive: newSubcategory.isActive,
          category: {
            id: newSubcategory.category.id,
            name: newSubcategory.category.name,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating subcategory: ${error.message}`,
        error.stack,
      );

      if (newSubcategory) {
        await this.prisma.subcategory.delete({
          where: { id: newSubcategory.id },
        });
        this.logger.error(
          `Subcategory has been deleted due to error in creation.`,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a subcategory');
    }
  }

  /**
   * Obtiene todas las subcategorias
   * @param user Usuario que realiza la petición
   * @returns Datos de las subcategorias
   */
  async findAll(user: UserPayload): Promise<SubcategoryData[]> {
    try {
      const subcategories = await this.prisma.subcategory.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
        },
        select: {
          id: true,
          name: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo SubcategoryData
      return subcategories.map((category) => ({
        id: category.id,
        name: category.name,
        isActive: category.isActive,
        category: {
          id: category.category.id,
          name: category.category.name,
        },
      })) as SubcategoryData[];
    } catch (error) {
      this.logger.error('Error getting all subcategories');
      handleException(error, 'Error getting all subcategories');
    }
  }

  /**
   * Obtiene todas las subcategorias de una categoria
   * @param id Id de la categoria
   * @param user Usuario que realiza la petición
   * @returns Datos de las subcategorias
   */
  async getAllSubcategoriesFromCategory(
    id: string,
    user: UserPayload,
  ): Promise<SubcategoryData[]> {
    try {
      await this.categoryService.findById(id);
      const subcategories = await this.prisma.subcategory.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
          categoryId: id,
        },
        select: {
          id: true,
          name: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo SubcategoryData
      return subcategories.map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        isActive: subcategory.isActive,
        category: {
          id: subcategory.category.id,
          name: subcategory.category.name,
        },
      })) as SubcategoryData[];
    } catch (error) {
      this.logger.error('Error getting all subcategories from category');
      handleException(error, 'Error getting all categories from category');
    }
  }

  /**
   * Obtiene una subcategoria por su id
   * @param id Id de la subcategoria
   * @returns Datos de la subcategoria
   */
  async findOne(id: string): Promise<SubcategoryData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get subcategory');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get subcategory');
    }
  }

  /**
   * Obtiene una subcategoria por su id
   * @param id Id de la subcategoria
   * @returns Datos de la subcategoria
   */
  async findById(id: string): Promise<SubcategoryData> {
    const subcategoryDb = await this.prisma.subcategory.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
      },
    });
    if (!subcategoryDb) {
      throw new BadRequestException('This subcategory doesnt exist');
    }

    if (!!subcategoryDb && !subcategoryDb.isActive) {
      throw new BadRequestException('This subcategory exist, but is inactive');
    }

    return subcategoryDb;
  }

  /**
   * Obtiene una subcategoria por su nombre
   * @param name Nombre de la subcategoria
   * @param id Id de la subcategoria
   * @returns Datos de la subcategoria
   */
  async findByName(name: string, id?: string): Promise<SubcategoryData> {
    const subcategoryDB = await this.prisma.subcategory.findFirst({
      where: { name },
      select: {
        id: true,
        name: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
      },
    });
    if (!!subcategoryDB && subcategoryDB.id !== id) {
      if (!!subcategoryDB && !subcategoryDB.isActive) {
        throw new BadRequestException(
          'This subcategory exists but is not active',
        );
      }
      if (subcategoryDB) {
        throw new BadRequestException('This subcategory already exists');
      }
    }

    return subcategoryDB;
  }

  /**
   * Actualiza una subcategoria
   * @param id Id de la subcategoria
   * @param updateSubcategoryDto Datos de la subcategoria a actualizar
   * @param user Usuario que realiza la petición
   * @returns SubcategoryData
   */
  async update(
    id: string,
    updateSubcategoryDto: UpdateSubcategoryDto,
    user: UserData,
  ): Promise<HttpResponse<SubcategoryData>> {
    const { name, categoryId } = updateSubcategoryDto;

    try {
      const subcategoryDB = await this.findById(id);

      if (name) {
        await this.findByName(name, id);
      }
      if (categoryId) {
        await this.categoryService.findById(categoryId);
      }

      // Validar si hay cambios
      const noChanges =
        (name === undefined || name === subcategoryDB.name) &&
        (categoryId === undefined || categoryId === subcategoryDB.category.id);

      if (noChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Subcategory updated successfully',
          data: {
            id: subcategoryDB.id,
            name: subcategoryDB.name,
            isActive: subcategoryDB.isActive,
            category: {
              id: subcategoryDB.category.id,
              name: subcategoryDB.category.name,
            },
          },
        };
      }

      // Construir el objeto de actualización dinámicamente solo con los campos presentes
      const updateData: any = {};
      if (name !== undefined && name !== subcategoryDB.name)
        updateData.name = name;
      if (categoryId !== undefined && categoryId !== subcategoryDB.category.id)
        updateData.categoryId = categoryId;

      // Transacción para realizar la actualización
      const updatedSubcategory = await this.prisma.$transaction(
        async (prisma) => {
          const subcategory = await prisma.subcategory.update({
            where: { id },
            data: updateData,
            select: {
              id: true,
              name: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              isActive: true,
            },
          });
          // Crear un registro de auditoría
          await prisma.audit.create({
            data: {
              entityId: subcategory.id,
              action: AuditActionType.UPDATE,
              performedById: user.id,
              entityType: 'subcategory',
            },
          });

          return subcategory;
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Subcategory updated successfully',
        data: updatedSubcategory,
      };
    } catch (error) {
      this.logger.error(
        `Error updating subcategory: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a subcategory');
    }
  }

  /**
   * Reactiva las subcategorias
   * @param user Usuario que realiza la acción
   * @param subcategories Subcategorias a reactivar
   * @returns Respuesta de la acción
   */
  async reactivateAll(
    user: UserData,
    subcategories: DeleteSubcategoriesDto,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar las subcategorias en la base de datos
        const subcategoriesDB = await prisma.subcategory.findMany({
          where: {
            id: { in: subcategories.ids },
          },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        });

        // Validar que se encontraron las subcategorias
        if (subcategoriesDB.length === 0) {
          throw new NotFoundException('Category not found or inactive');
        }

        // Reactivar las subcategorias
        const reactivatePromises = subcategoriesDB.map(async (subcategory) => {
          // Activar la subcategoria
          await prisma.subcategory.update({
            where: { id: subcategory.id },
            data: { isActive: true },
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.UPDATE,
              entityId: subcategory.id,
              entityType: 'subcategory',
              performedById: user.id,
              createdAt: new Date(),
            },
          });

          return {
            id: subcategory.id,
            name: subcategory.name,
            isActive: subcategory.isActive,
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'subcategories reactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error reactivating subcategories', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error reactivating subcategories');
    }
  }

  /**
   * Desactiva las subcategorias
   * @param subcategories Subcategorias a desactivar
   * @param user Usuario que realiza la acción
   * @returns Respuesta de la acción
   */
  async removeAll(
    subcategories: DeleteSubcategoriesDto,
    user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar las subcategorias en la base de datos
        const subcategoriesDB = await prisma.subcategory.findMany({
          where: {
            id: { in: subcategories.ids },
          },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        });

        // Validar que se encontraron las subcategorias
        if (subcategoriesDB.length === 0) {
          throw new NotFoundException('Category not found or inactive');
        }

        const deactivatePromises = subcategoriesDB.map(
          async (subcategoryDelete) => {
            // Desactivar las subcategorias
            await prisma.category.update({
              where: { id: subcategoryDelete.id },
              data: { isActive: false },
            });

            await this.prisma.audit.create({
              data: {
                action: AuditActionType.DELETE,
                entityId: subcategoryDelete.id,
                entityType: 'subcategory',
                performedById: user.id,
                createdAt: new Date(),
              },
            });

            return {
              id: subcategoryDelete.id,
              name: subcategoryDelete.name,
              isActive: subcategoryDelete.isActive,
            };
          },
        );

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Subcategories deactivate successfully',
      };
    } catch (error) {
      this.logger.error('Error deactivating subcategories', error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      handleException(error, 'Error deactivating subcategories');
    }
  }
}
