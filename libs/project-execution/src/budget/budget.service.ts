import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PrismaService } from '@prisma/prisma';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import {
  BudgetData,
  CategoryBudgetDetails,
  SummaryBudgetData,
} from '../interfaces';
import { ClientsService } from '@clients/clients';
import { ProjectService } from '@design-projects/design-projects/project/project.service';
import { AuditActionType, BudgetStatusType } from '@prisma/client';
import { handleException } from '@login/login/utils';
import { CategoryService } from '../category/category.service';
import { SubcategoryService } from '../subcategory/subcategory.service';
import { UpdateBudgetStatusDto } from './dto/update-status-budget.dto';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: ClientsService,
    private readonly designProjectService: ProjectService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
  ) {}

  private async generateCodeBudget(): Promise<string> {
    // Generar el siguiente código incremental
    const lastProject = await this.prisma.budget.findFirst({
      where: { code: { startsWith: 'PRS-DIS-' } },
      orderBy: { code: 'desc' }, // Orden descendente
    });

    const lastIncrement = lastProject
      ? parseInt(lastProject.code.split('-')[2], 10)
      : 0;
    const projectCode = `PRS-EJE-${String(lastIncrement + 1).padStart(3, '0')}`;
    return projectCode;
  }

  /**
   * Crear un nuevo presupuesto
   * @param createBudgetDto Datos del presupuesto a crear
   * @param user Usuario que realiza la petición
   * @returns Datos del presupuesto creado
   */
  async create(
    createBudgetDto: CreateBudgetDto,
    user: UserData,
  ): Promise<HttpResponse<BudgetData>> {
    const {
      name,
      ubication,
      dateProject,
      clientId,
      designProjectId,
      directCost,
      overhead,
      igv,
      discount,
      utility,
      percentageOverhead,
      percentageUtility,
      totalCost,
      category,
    } = createBudgetDto;
    let newBudget;
    let newBudgetDetail;
    let newCategory;
    let designProjectDB = null; // Inicializar como null

    try {
      // Generar el código del presupuesto
      const projectCode = await this.generateCodeBudget();
      await this.clientService.findById(clientId);
      if (designProjectId) {
        designProjectDB =
          await this.designProjectService.findById(designProjectId);
        if (designProjectDB.status !== 'APPROVED') {
          throw new BadRequestException('The design project must be approved');
        }
      }
      // Crear el presupuesto y registrar la auditoría
      newBudget = await this.prisma.$transaction(async () => {
        // Crear el nuevo presupuesto
        const budget = await this.prisma.budget.create({
          data: {
            name,
            ubication,
            dateProject,
            clientId,
            designProjectId,
            code: projectCode,
          },
          select: {
            id: true,
            name: true,
            status: true,
            code: true,
            dateProject: true,
            ubication: true,
            codeBudget: true,
            clientBudget: {
              select: {
                id: true,
                name: true,
              },
            },
            designProjectId: true,
          },
        });

        // Registrar la auditoría de la creación del presupuesto
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: budget.id,
            entityType: 'budget',
            performedById: user.id,
          },
        });

        return budget;
      });

      // Crear el detalle del presupuesto y registrar la auditoría
      newBudgetDetail = await this.prisma.$transaction(async () => {
        // Crear el nuevo detalle del presupuesto
        const budgetDetail = await this.prisma.budgetDetail.create({
          data: {
            directCost,
            overhead,
            igv,
            discount,
            utility,
            percentageOverhead,
            percentageUtility,
            totalCost,
            budgetId: newBudget.id,
          },
          select: {
            id: true,
            directCost: true,
            overhead: true,
            igv: true,
            discount: true,
            utility: true,
            percentageOverhead: true,
            percentageUtility: true,
            totalCost: true,
          },
        });

        newCategory = await this.prisma.$transaction(async () => {
          const createdCategories = [];

          for (const element of category) {
            const categoryDB = await this.categoryService.findById(
              element.categoryId,
            );
            if (categoryDB) {
              const categoryCreated = await this.prisma.categoryBudget.create({
                data: {
                  categoryId: element.categoryId,
                  budgetDetailId: budgetDetail.id,
                  subtotal: element.subtotal,
                },
                select: {
                  id: true,
                  subtotal: true,
                },
              });

              const createdSubcategories = await Promise.all(
                element.subcategory.map(async (subElement) => {
                  const subcategoryDB = await this.subcategoryService.findById(
                    subElement.subcategoryId,
                  );
                  if (subcategoryDB) {
                    const subCategoryCreated =
                      await this.prisma.subcategoryBudget.create({
                        data: {
                          subcategoryId: subElement.subcategoryId,
                          categoryBudgetId: categoryCreated.id,
                          subtotal: subElement.subtotal,
                        },
                        select: {
                          id: true,
                          subtotal: true,
                        },
                      });

                    const createdWorkItems = await Promise.all(
                      subElement.workItem.map(async (workElement) => {
                        const workitemDB =
                          await this.prisma.workItem.findUnique({
                            where: {
                              id: workElement.workItemId,
                            },
                          });
                        if (workitemDB) {
                          const workItemBudgetCreated =
                            await this.prisma.workItemBudget.create({
                              data: {
                                workItemId: workElement.workItemId,
                                subcategoryBudgetId: subCategoryCreated.id,
                                quantity: workElement.quantity,
                                unitCost: workElement.unitCost,
                                subtotal: workElement.subtotal,
                              },
                              select: {
                                id: true,
                                quantity: true,
                                unitCost: true,
                                subtotal: true,
                              },
                            });

                          const createdSubWorkItems = workElement.subWorkItem
                            ? await Promise.all(
                                workElement.subWorkItem.map(
                                  async (subWorkElement) => {
                                    const subworkitemDB =
                                      await this.prisma.subWorkItem.findUnique({
                                        where: {
                                          id: subWorkElement.subWorkItemId,
                                        },
                                      });
                                    if (subworkitemDB) {
                                      return await this.prisma.subWorkItemBudget.create(
                                        {
                                          data: {
                                            workItemBudgetId:
                                              workItemBudgetCreated.id,
                                            subWorkItemId:
                                              subWorkElement.subWorkItemId,
                                            quantity: subWorkElement.quantity,
                                            unitCost: subWorkElement.unitCost,
                                            subtotal: subWorkElement.subtotal,
                                          },
                                          select: {
                                            id: true,
                                            quantity: true,
                                            unitCost: true,
                                            subtotal: true,
                                          },
                                        },
                                      );
                                    }
                                  },
                                ),
                              )
                            : [];

                          return {
                            workItemBudgetCreated,
                            createdSubWorkItems,
                          };
                        }
                      }),
                    );

                    return {
                      subCategoryCreated,
                      createdWorkItems,
                    };
                  }
                }),
              );

              createdCategories.push({
                categoryCreated,
                createdSubcategories,
              });
            }
          }

          return createdCategories;
        });

        // Registrar la auditoría de la creación del detalle del presupuesto
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: budgetDetail.id,
            entityType: 'budgetDetail',
            performedById: user.id,
          },
        });

        return budgetDetail;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Budget created successfully',
        data: {
          id: newBudget.id,
          name: newBudget.name,
          codeBudget: newBudget.codeBudget,
          code: newBudget.code,
          ubication: newBudget.ubication,
          status: newBudget.status,
          dateProject: newBudget.dateProject,
          clientBudget: newBudget.clientBudget,
          designProjectBudget: designProjectDB
            ? {
                id: designProjectDB.id,
                code: designProjectDB.code,
              }
            : null,
          budgetDetail: newBudgetDetail,
          category: newCategory,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating budget: ${error.message}`, error.stack);

      if (newBudget) {
        await this.prisma.budgetDetail.delete({
          where: { id: newBudgetDetail.id },
        });
        await this.prisma.budget.delete({ where: { id: newBudget.id } });
        this.logger.error(`Budget has been deleted due to error in creation.`);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error creating a budget');
    }
  }

  /**
   * Obtener todos los presupuestos
   * @param user Usuario que realiza la petición
   * @returns Lista de presupuestos
   */
  async findAll(user: UserPayload): Promise<SummaryBudgetData[]> {
    try {
      const budgets = await this.prisma.budget.findMany({
        where: {
          ...(user.isSuperAdmin
            ? {}
            : {
                status: {
                  in: [BudgetStatusType.PENDING, BudgetStatusType.APPROVED],
                },
              }), // Filtrar por status solo si no es super admin
        },
        select: {
          id: true,
          name: true,
          codeBudget: true,
          code: true,
          ubication: true,
          status: true,
          dateProject: true,
          clientBudget: {
            select: {
              id: true,
              name: true,
            },
          },
          designProjectId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Mapea los resultados al tipo CategoryData
      const summaryBudgets = await Promise.all(
        budgets.map(async (budget) => {
          const designProjectDB = budget.designProjectId
            ? await this.designProjectService.findById(budget.designProjectId)
            : null;

          return {
            id: budget.id,
            name: budget.name,
            codeBudget: budget.codeBudget,
            code: budget.code,
            ubication: budget.ubication,
            status: budget.status,
            dateProject: budget.dateProject,
            clientBudget: budget.clientBudget,
            designProjectBudget: designProjectDB
              ? {
                  id: designProjectDB.id,
                  code: designProjectDB.code,
                }
              : null,
          };
        }),
      );

      return summaryBudgets as SummaryBudgetData[];
    } catch (error) {
      this.logger.error('Error getting all categories');
      handleException(error, 'Error getting all categories');
    }
  }

  async findOne(id: string): Promise<BudgetData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get budget');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get budget');
    }
  }

  /**
   * Obtener un presupuesto por su id
   * @param id Id del presupuesto
   * @returns Datos del presupuesto
   */
  async findById(id: string): Promise<BudgetData> {
    // Buscar el presupuesto con sus relaciones
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        codeBudget: true,
        code: true,
        ubication: true,
        status: true,
        dateProject: true,
        clientBudget: {
          select: { id: true, name: true },
        },
        designProjectId: true,
        budgetDetail: {
          select: {
            id: true,
            directCost: true,
            overhead: true,
            utility: true,
            igv: true,
            discount: true,
            percentageOverhead: true,
            percentageUtility: true,
            totalCost: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException(`This budget doesnt exist`);
    }

    const categoriesDB = await this.findCategoryBudgets(
      budget.budgetDetail.map((detail) => detail.id),
    );

    let designProjectDB = null;
    if (budget.designProjectId !== null) {
      designProjectDB = await this.designProjectService.findById(
        budget.designProjectId,
      );
    }

    // Formatear la respuesta en el tipo esperado
    const response: BudgetData = {
      id: budget.id,
      name: budget.name,
      codeBudget: budget.codeBudget,
      code: budget.code,
      ubication: budget.ubication,
      status: budget.status,
      dateProject: budget.dateProject,
      clientBudget: budget.clientBudget,
      designProjectBudget: designProjectDB
        ? {
            id: designProjectDB.id,
            code: designProjectDB.code,
          }
        : null,
      budgetDetail: budget.budgetDetail,
      category: categoriesDB,
    };

    return response;
  }

  /**
   * Obtener un presupuesto por su id con datos resumidos
   * @param id Id del presupuesto
   * @returns Datos resumidos del presupuesto
   */
  async findByIdSummaryData(id: string): Promise<SummaryBudgetData> {
    // Buscar el presupuesto con sus relaciones
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        codeBudget: true,
        code: true,
        ubication: true,
        status: true,
        dateProject: true,
        clientBudget: {
          select: { id: true, name: true },
        },
        designProjectId: true,
      },
    });

    if (!budget) {
      throw new NotFoundException(`This budget doesnt exist`);
    }

    let designProjectDB = null;
    if (budget.designProjectId !== null) {
      designProjectDB = await this.designProjectService.findById(
        budget.designProjectId,
      );
    }

    // Formatear la respuesta en el tipo esperado
    const response: SummaryBudgetData = {
      id: budget.id,
      name: budget.name,
      codeBudget: budget.codeBudget,
      code: budget.code,
      ubication: budget.ubication,
      status: budget.status,
      dateProject: budget.dateProject,
      clientBudget: budget.clientBudget,
      designProjectBudget: designProjectDB
        ? {
            id: designProjectDB.id,
            code: designProjectDB.code,
          }
        : null,
    };

    return response;
  }

  /**
   * Obtener los detalles de los presupuestos de una categoría
   * @param budgetDetailIds Lista de ids de los detalles de presupuesto
   * @returns Detalles de los presupuestos de una categoría
   */
  async findCategoryBudgets(
    budgetDetailIds: string[],
  ): Promise<CategoryBudgetDetails[]> {
    try {
      const categoryBudgets = await this.prisma.categoryBudget.findMany({
        where: { budgetDetailId: { in: budgetDetailIds } },
        select: {
          id: true,
          categoryId: true,
          subtotal: true,
          budgetDetailId: true,
        },
      });

      const subcategoryBudgets = await this.prisma.subcategoryBudget.findMany({
        where: {
          categoryBudgetId: {
            in: categoryBudgets.map((category) => category.id),
          },
        },
        select: {
          id: true,
          categoryBudgetId: true,
          subcategoryId: true,
          subtotal: true,
        },
      });

      const workItemBudgets = await this.prisma.workItemBudget.findMany({
        where: {
          subcategoryBudgetId: {
            in: subcategoryBudgets.map((subcategory) => subcategory.id),
          },
        },
        select: {
          id: true,
          workItemId: true,
          subcategoryBudgetId: true,
          quantity: true,
          unitCost: true,
          subtotal: true,
        },
      });

      const subWorkItemBudgets = await this.prisma.subWorkItemBudget.findMany({
        where: {
          workItemBudgetId: {
            in: workItemBudgets.map((workItem) => workItem.id),
          },
        },
        select: {
          id: true,
          workItemBudgetId: true,
          subWorkItemId: true,
          quantity: true,
          unitCost: true,
          subtotal: true,
        },
      });

      const categoryBudgetDetails = await Promise.all(
        categoryBudgets.map(async (category) => {
          const categoryName = await this.prisma.category.findUnique({
            where: { id: category.categoryId },
            select: { name: true },
          });

          const subcategories = await Promise.all(
            subcategoryBudgets
              .filter(
                (subcategory) => subcategory.categoryBudgetId === category.id,
              )
              .map(async (subcategory) => {
                const subcategoryName =
                  await this.prisma.subcategory.findUnique({
                    where: { id: subcategory.subcategoryId },
                    select: { name: true },
                  });

                const workitems = await Promise.all(
                  workItemBudgets
                    .filter(
                      (workItem) =>
                        workItem.subcategoryBudgetId === subcategory.id,
                    )
                    .map(async (workItem) => {
                      const workItemName =
                        await this.prisma.workItem.findUnique({
                          where: { id: workItem.workItemId },
                          select: { name: true, unit: true },
                        });

                      const subWorkItems = await Promise.all(
                        subWorkItemBudgets
                          .filter(
                            (subWorkItem) =>
                              subWorkItem.workItemBudgetId === workItem.id,
                          )
                          .map(async (subWorkItem) => {
                            const subWorkItemName =
                              await this.prisma.subWorkItem.findUnique({
                                where: { id: subWorkItem.subWorkItemId },
                                select: { name: true, unit: true },
                              });

                            return {
                              id: subWorkItem.id,
                              name: subWorkItemName?.name || '',
                              unit: subWorkItemName?.unit || '',
                              quantity: subWorkItem.quantity,
                              unitCost: subWorkItem.unitCost,
                              subtotal: subWorkItem.subtotal,
                            };
                          }),
                      );

                      return {
                        id: workItem.id,
                        name: workItemName?.name || '',
                        unit: workItemName?.unit || '',
                        quantity: workItem.quantity,
                        unitCost: workItem.unitCost,
                        subtotal: workItem.subtotal,
                        subWorkItems: subWorkItems.map((subWorkItem) => ({
                          id: subWorkItem.id,
                          name: subWorkItem.name,
                          unit: subWorkItem.unit,
                          quantity: subWorkItem.quantity,
                          unitCost: subWorkItem.unitCost,
                          subtotal: subWorkItem.subtotal,
                        })),
                      };
                    }),
                );

                return {
                  id: subcategory.id,
                  name: subcategoryName?.name || '',
                  workitem: workitems,
                };
              }),
          );

          return {
            id: category.id,
            name: categoryName?.name || '',
            budgetDetailId: category.budgetDetailId,
            subcategory: subcategories,
          };
        }),
      );

      return categoryBudgetDetails;
    } catch (error) {
      this.logger.error('Error getting category budgets');
      handleException(error, 'Error getting category budgets');
    }
  }

  /**
   * Actualizar un presupuesto
   * @param id Id del presupuesto
   * @param updateBudgetDto Datos del presupuesto a actualizar
   * @param user Usuario que realiza la petición
   * @returns Datos del presupuesto actualizado
   */
  async update(
    id: string,
    updateBudgetDto: UpdateBudgetDto,
    user: UserData,
  ): Promise<HttpResponse<BudgetData>> {
    const {
      name,
      ubication,
      dateProject,
      clientId,
      designProjectId,
      directCost,
      overhead,
      igv,
      discount,
      utility,
      percentageOverhead,
      percentageUtility,
      totalCost,
      category: updatedCategories,
    } = updateBudgetDto;

    let updatedBudget;
    let updatedBudgetDetail;
    let designProjectDB = null;

    try {
      // Verificar si el presupuesto existe
      const existingBudget = await this.prisma.budget.findUnique({
        where: { id },
        include: {
          budgetDetail: {
            include: {
              budgetCategory: {
                include: {
                  subcategoryBudget: {
                    include: {
                      workItemBudget: {
                        include: {
                          subWorkItemBudget: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!existingBudget) {
        throw new NotFoundException('Budget not found');
      }

      // Validar el cliente
      await this.clientService.findById(clientId);

      // Validar el proyecto de diseño
      if (designProjectId) {
        designProjectDB =
          await this.designProjectService.findById(designProjectId);
        if (designProjectDB.status !== 'APPROVED') {
          throw new BadRequestException('The design project must be approved');
        }
      }

      // Iniciar una transacción
      await this.prisma.$transaction(async (prisma) => {
        // Actualizar el presupuesto
        updatedBudget = await prisma.budget.update({
          where: { id },
          data: {
            name,
            ubication,
            dateProject,
            clientId,
            designProjectId,
          },
          select: {
            id: true,
            name: true,
            status: true,
            code: true,
            dateProject: true,
            ubication: true,
            codeBudget: true,
            clientBudget: {
              select: {
                id: true,
                name: true,
              },
            },
            designProjectId: true,
          },
        });

        const idBudgetDetail = existingBudget.budgetDetail[0].id;

        // Actualizar el detalle del presupuesto
        updatedBudgetDetail = await prisma.budgetDetail.update({
          where: { id: idBudgetDetail },
          data: {
            directCost,
            overhead,
            igv,
            discount,
            utility,
            percentageOverhead,
            percentageUtility,
            totalCost,
          },
          select: {
            id: true,
            directCost: true,
            overhead: true,
            igv: true,
            discount: true,
            utility: true,
            percentageOverhead: true,
            percentageUtility: true,
            totalCost: true,
          },
        });

        // Procesar las categorías actualizadas
        const existingCategories =
          existingBudget.budgetDetail[0].budgetCategory;
        const updatedCategoryIds = updatedCategories.map(
          (cat) => cat.categoryId,
        );

        // Identificar categorías a eliminar
        const categoriesToDelete = existingCategories.filter(
          (cat) => !updatedCategoryIds.includes(cat.categoryId),
        );

        // Eliminar categorías y sus dependencias en orden correcto
        for (const category of categoriesToDelete) {
          // Eliminar subcategorías y sus dependencias
          for (const subcategory of category.subcategoryBudget) {
            // Eliminar workItems y sus dependencias
            for (const workItem of subcategory.workItemBudget) {
              // Eliminar subWorkItems
              await prisma.subWorkItemBudget.deleteMany({
                where: { workItemBudgetId: workItem.id },
              });
              // Eliminar workItem
              await prisma.workItemBudget.delete({
                where: { id: workItem.id },
              });
            }
            // Eliminar subcategoría
            await prisma.subcategoryBudget.delete({
              where: { id: subcategory.id },
            });
          }
          // Eliminar categoría
          await prisma.categoryBudget.delete({
            where: { id: category.id },
          });
        }

        // Procesar categorías actualizadas o nuevas
        for (const updatedCategory of updatedCategories) {
          let categoryBudgetId;
          // Buscar categoría existente
          let existingCategory = existingCategories.find(
            (cat) => cat.categoryId === updatedCategory.categoryId,
          );

          if (existingCategory) {
            // Actualizar categoría existente
            await prisma.categoryBudget.update({
              where: { id: existingCategory.id },
              data: {
                subtotal: updatedCategory.subtotal,
              },
            });
            categoryBudgetId = existingCategory.id;
          } else {
            // Crear nueva categoría
            const newCategory = await prisma.categoryBudget.create({
              data: {
                categoryId: updatedCategory.categoryId,
                budgetDetailId: updatedBudgetDetail.id,
                subtotal: updatedCategory.subtotal,
              },
            });
            categoryBudgetId = newCategory.id;
            existingCategory = { ...newCategory, subcategoryBudget: [] };
            existingCategory.subcategoryBudget = [];
          }

          // Procesar subcategorías
          const existingSubcategories =
            existingCategory.subcategoryBudget || [];
          const updatedSubcategories = updatedCategory.subcategory;
          const updatedSubcategoryIds = updatedSubcategories.map(
            (subcat) => subcat.subcategoryId,
          ); // Identificar subcategorías a eliminar
          const subcategoriesToDelete = existingSubcategories.filter(
            (subcat) => !updatedSubcategoryIds.includes(subcat.subcategoryId),
          );

          // Eliminar subcategorías y sus dependencias
          for (const subcategory of subcategoriesToDelete) {
            // Eliminar workItems y sus dependencias
            for (const workItem of subcategory.workItemBudget) {
              // Eliminar subWorkItems
              await prisma.subWorkItemBudget.deleteMany({
                where: { workItemBudgetId: workItem.id },
              });
              // Eliminar workItem
              await prisma.workItemBudget.delete({
                where: { id: workItem.id },
              });
            }
            // Eliminar subcategoría
            await prisma.subcategoryBudget.delete({
              where: { id: subcategory.id },
            });
          }

          // Procesar subcategorías actualizadas o nuevas
          for (const updatedSubcategory of updatedSubcategories) {
            let subcategoryBudgetId;
            // Buscar subcategoría existente
            let existingSubcategory = existingSubcategories.find(
              (subcat) =>
                subcat.subcategoryId === updatedSubcategory.subcategoryId,
            );

            if (existingSubcategory) {
              // Actualizar subcategoría existente
              await prisma.subcategoryBudget.update({
                where: { id: existingSubcategory.id },
                data: {
                  subtotal: updatedSubcategory.subtotal,
                },
              });
              subcategoryBudgetId = existingSubcategory.id;
            } else {
              // Crear nueva subcategoría
              const newSubcategory = await prisma.subcategoryBudget.create({
                data: {
                  subcategoryId: updatedSubcategory.subcategoryId,
                  categoryBudgetId,
                  subtotal: updatedSubcategory.subtotal,
                },
              });
              subcategoryBudgetId = newSubcategory.id;
              existingSubcategory = { ...newSubcategory, workItemBudget: [] };
              existingSubcategory.workItemBudget = [];
            }

            // Procesar workItems
            const existingWorkItems = existingSubcategory.workItemBudget || [];
            const updatedWorkItems = updatedSubcategory.workItem;
            const updatedWorkItemIds = updatedWorkItems.map(
              (item) => item.workItemId,
            );

            // Identificar workItems a eliminar
            const workItemsToDelete = existingWorkItems.filter(
              (item) => !updatedWorkItemIds.includes(item.workItemId),
            );

            // Eliminar workItems y sus dependencias
            for (const workItem of workItemsToDelete) {
              // Eliminar subWorkItems
              await prisma.subWorkItemBudget.deleteMany({
                where: { workItemBudgetId: workItem.id },
              });
              // Eliminar workItem
              await prisma.workItemBudget.delete({
                where: { id: workItem.id },
              });
            }

            // Procesar workItems actualizados o nuevos
            for (const updatedWorkItem of updatedWorkItems) {
              let workItemBudgetId;
              // Buscar workItem existente
              let existingWorkItem = existingWorkItems.find(
                (item) => item.workItemId === updatedWorkItem.workItemId,
              );

              if (existingWorkItem) {
                // Actualizar workItem existente
                await prisma.workItemBudget.update({
                  where: { id: existingWorkItem.id },
                  data: {
                    quantity: updatedWorkItem.quantity,
                    unitCost: updatedWorkItem.unitCost,
                    subtotal: updatedWorkItem.subtotal,
                  },
                });
                workItemBudgetId = existingWorkItem.id;
              } else {
                // Crear nuevo workItem
                const newWorkItem = await prisma.workItemBudget.create({
                  data: {
                    workItemId: updatedWorkItem.workItemId,
                    subcategoryBudgetId,
                    quantity: updatedWorkItem.quantity,
                    unitCost: updatedWorkItem.unitCost,
                    subtotal: updatedWorkItem.subtotal,
                  },
                });
                workItemBudgetId = newWorkItem.id;
                existingWorkItem = { ...newWorkItem, subWorkItemBudget: [] };
                existingWorkItem.subWorkItemBudget = [];
              }

              // Procesar subWorkItems
              const existingSubWorkItems =
                existingWorkItem.subWorkItemBudget || [];
              const updatedSubWorkItems = updatedWorkItem.subWorkItem || [];
              const updatedSubWorkItemIds = updatedSubWorkItems.map(
                (subItem) => subItem.subWorkItemId,
              );

              // Identificar subWorkItems a eliminar
              const subWorkItemsToDelete = existingSubWorkItems.filter(
                (subItem) =>
                  !updatedSubWorkItemIds.includes(subItem.subWorkItemId),
              );

              // Eliminar subWorkItems
              for (const subWorkItem of subWorkItemsToDelete) {
                await prisma.subWorkItemBudget.delete({
                  where: { id: subWorkItem.id },
                });
                console.log('Deleted subWorkItem', subWorkItem.id);
              }

              // Procesar subWorkItems actualizados o nuevos
              for (const updatedSubWorkItem of updatedSubWorkItems) {
                const existingSubWorkItem = existingSubWorkItems.find(
                  (subItem) =>
                    subItem.subWorkItemId === updatedSubWorkItem.subWorkItemId,
                );

                if (existingSubWorkItem) {
                  // Actualizar subWorkItem existente
                  await prisma.subWorkItemBudget.update({
                    where: { id: existingSubWorkItem.id },
                    data: {
                      quantity: updatedSubWorkItem.quantity,
                      unitCost: updatedSubWorkItem.unitCost,
                      subtotal: updatedSubWorkItem.subtotal,
                    },
                  });
                } else {
                  // Crear nuevo subWorkItem
                  await prisma.subWorkItemBudget.create({
                    data: {
                      subWorkItemId: updatedSubWorkItem.subWorkItemId,
                      workItemBudgetId,
                      quantity: updatedSubWorkItem.quantity,
                      unitCost: updatedSubWorkItem.unitCost,
                      subtotal: updatedSubWorkItem.subtotal,
                    },
                  });
                }
              }
            }
          }
        }

        // Registrar auditoría de la actualización
        await prisma.audit.create({
          data: {
            action: AuditActionType.UPDATE,
            entityId: id,
            entityType: 'budget',
            performedById: user.id,
          },
        });
      });

      // Después de la transacción, obtener las categorías actualizadas con nombres
      const categoryDetails = await this.findCategoryBudgets([
        updatedBudgetDetail.id,
      ]);

      return {
        statusCode: HttpStatus.OK,
        message: 'Budget updated successfully',
        data: {
          id: updatedBudget.id,
          name: updatedBudget.name,
          codeBudget: updatedBudget.codeBudget,
          code: updatedBudget.code,
          ubication: updatedBudget.ubication,
          status: updatedBudget.status,
          dateProject: updatedBudget.dateProject,
          clientBudget: updatedBudget.clientBudget,
          designProjectBudget: designProjectDB
            ? {
                id: designProjectDB.id,
                code: designProjectDB.code,
              }
            : null,
          budgetDetail: updatedBudgetDetail,
          category: categoryDetails,
        },
      };
    } catch (error) {
      this.logger.error(`Error updating budget: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      handleException(error, 'Error updating a budget');
    }
  }

  /**
   * Actualizar el estado de un presupuesto
   * @param id Id del presupuesto
   * @param updateBudgetStatusDto Datos para actualizar el estado del presupuesto
   * @param user Usuario que realiza la petición
   * @returns Datos del presupuesto con el nuevo estado
   */
  async updateStatus(
    id: string,
    updateBudgetStatusDto: UpdateBudgetStatusDto,
    user: UserData,
  ): Promise<HttpResponse<SummaryBudgetData>> {
    const newStatus = updateBudgetStatusDto.newStatus;

    let budgetDB;

    await this.prisma.$transaction(async (prisma) => {
      budgetDB = await this.findByIdSummaryData(id);

      if (budgetDB.status === newStatus) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Budget status updated successfully',
          data: {
            id: budgetDB.id,
            name: budgetDB.name,
            codeBudget: budgetDB.codeBudget,
            code: budgetDB.code,
            ubication: budgetDB.ubication,
            status: budgetDB.status,
            dateProject: budgetDB.dateProject,
            clientBudget: budgetDB.clientBudget,
            designProjectBudget: budgetDB.designProjectBudget,
          },
        };
      }

      // update the status
      await prisma.budget.update({
        where: {
          id,
        },
        data: {
          status: newStatus,
        },
      });

      // store the action in audit
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.UPDATE,
          entityId: budgetDB.id,
          entityType: 'budget',
          performedById: user.id,
        },
      });
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Budget status updated successfully',
      data: {
        id: budgetDB.id,
        name: budgetDB.name,
        codeBudget: budgetDB.codeBudget,
        code: budgetDB.code,
        ubication: budgetDB.ubication,
        status: newStatus,
        dateProject: budgetDB.dateProject,
        clientBudget: budgetDB.clientBudget,
        designProjectBudget: budgetDB.designProjectBudget,
      },
    };
  }
}
