import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, PrismaTransaction } from '@prisma/prisma';
import { AuditService } from '@login/login/admin/audit/audit.service';

@Injectable()
export class ProjectCharterService {
  private readonly logger = new Logger(ProjectCharterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Creates a new project charter linked to a design project
   * @param designProjectId ID of the design project
   * @param prismaTransaction Prisma transaction context
   */
  async create(
    designProjectId: string,
    prismaTransaction: PrismaTransaction,
  ): Promise<void> {
    try {
      await prismaTransaction.projectCharter.create({
        data: {
          designProject: {
            connect: {
              id: designProjectId,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating project charter for project ${designProjectId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a project charter by ID
   * @param id Project charter ID
   * @returns Project charter or throws NotFoundException
   */
  async findById(id: string) {
    const projectCharter = await this.prisma.projectCharter.findUnique({
      where: { id },
    });

    if (!projectCharter) {
      throw new NotFoundException('Project charter not found');
    }

    return projectCharter;
  }
}
