import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  StreamableFile,
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
import { UpdateBudgetStatusDto } from './dto/update-status-budget.dto';

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

  @ApiOkResponse({ description: 'Budget successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<BudgetData>> {
    return this.budgetService.update(id, updateBudgetDto, user);
  }

  @ApiOkResponse({ description: 'Status updated successfully' })
  @Patch('status/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body() newStatus: UpdateBudgetStatusDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<SummaryBudgetData>> {
    return await this.budgetService.updateStatus(id, newStatus, user);
  }

  @ApiOkResponse({ description: 'Pdf of Budget successfully generated' })
  @Get(':id/pdf')
  genPdf(@Param('id') id: string): Promise<StreamableFile> {
    return this.budgetService.genPdf(id);
  }

  @Get(':id/pdflayout')
  async pdfTemplate(@Param('id') id: string): Promise<string> {
    return await this.budgetService.genPdfTemplate(id);
  }

  @Get('/approved/budgets')
  @ApiOkResponse({
    description:
      'Get all budgets that can be used to create a Project (approved, and not linked to another project)',
  })
  findCreatable() {
    return this.budgetService.findCreatable();
  }
}
