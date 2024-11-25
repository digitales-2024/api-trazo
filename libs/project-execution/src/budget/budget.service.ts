import { Injectable, Logger } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PrismaService } from '@prisma/prisma';
import { UserData } from '@login/login/interfaces';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createBudgetDto: CreateBudgetDto, user: UserData) {
    return `This action adds a new budget ${createBudgetDto} ${user}`;
  }

  findAll() {
    return `This action returns all budget`;
  }

  findOne(id: number) {
    return `This action returns a #${id} budget`;
  }

  update(id: number, updateBudgetDto: UpdateBudgetDto) {
    return `This action updates a #${id}  ${updateBudgetDto} budget`;
  }

  remove(id: number) {
    return `This action removes a #${id} budget`;
  }
}
