import { Injectable } from '@nestjs/common';
import { CreateWorkitemDto } from './dto/create-workitem.dto';
import { UpdateWorkitemDto } from './dto/update-workitem.dto';
import { PrismaService } from '@prisma/prisma';
import { UserData } from '@login/login/interfaces';

@Injectable()
export class WorkitemsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createWorkitemDto: CreateWorkitemDto) {
    return 'This action adds a new workitem';
  }

  async findAll(user: UserData) {
    // Get all workitems
    const workitems = await this.prisma.workItem.findMany({
      select: {
        id: true,
        name: true,
        unit: true,
        unitCost: true,
        subWorkItem: {
          select: {
            id: true,
            name: true,
            unit: true,
            unitCost: true,
          },
          where: {
            ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
          },
        },
      },
      where: {
        // if user is superadmin get all
        ...(user.isSuperAdmin ? {} : { isActive: true }), // Filtrar por isActive solo si no es super admin
      },
    });

    // Check all workitems have either a subworkitem, or a relation to apu
    // Get the APUs
    return workitems;
  }

  findOne(id: number) {
    return `This action returns a #${id} workitem`;
  }

  update(id: number, updateWorkitemDto: UpdateWorkitemDto) {
    return `This action updates a #${id} workitem`;
  }

  remove(id: number) {
    return `This action removes a #${id} workitem`;
  }
}
