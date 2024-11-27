import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { BudgetData, SummaryBudgetData } from '../interfaces';

@ApiTags('Budget')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'budget', version: '1' })
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @ApiCreatedResponse({
    description: 'Budget successfully created',
  })
  @Post()
  create(
    @Body() createBudgetDto: CreateBudgetDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<BudgetData>> {
    return this.budgetService.create(createBudgetDto, user);
  }

  @ApiOkResponse({ description: 'Get all budgets' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<SummaryBudgetData[]> {
    return this.budgetService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get budget by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<BudgetData> {
    return this.budgetService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBudgetDto: UpdateBudgetDto) {
    return this.budgetService.update(+id, updateBudgetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgetService.remove(+id);
  }
}
