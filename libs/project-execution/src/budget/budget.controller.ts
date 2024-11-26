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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { BudgetData } from '../interfaces';

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

  @Get()
  findAll() {
    return this.budgetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetService.findOne(+id);
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
