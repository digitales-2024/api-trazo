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
    const projectCode = `PRS-DIS-${String(lastIncrement + 1).padStart(3, '0')}`;
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
                          select: { name: true },
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
                                select: { name: true },
                              });

                            return {
                              id: subWorkItem.id,
                              name: subWorkItemName?.name || '',
                              quantity: subWorkItem.quantity,
                              unitCost: subWorkItem.unitCost,
                              subtotal: subWorkItem.subtotal,
                            };
                          }),
                      );

                      return {
                        id: workItem.id,
                        name: workItemName?.name || '',
                        quantity: workItem.quantity,
                        unitCost: workItem.unitCost,
                        subtotal: workItem.subtotal,
                        subWorkItems: subWorkItems.map((subWorkItem) => ({
                          id: subWorkItem.id,
                          name: subWorkItem.name,
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

  update(id: number, updateBudgetDto: UpdateBudgetDto) {
    return `This action updates a #${id}  ${updateBudgetDto} budget`;
  }

  remove(id: number) {
    return `This action removes a #${id} budget`;
  }
}
