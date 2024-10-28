import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData, UserPayload } from '@login/login/interfaces';
import { UpdateQuotationStatusDto } from './dto/update-status.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@ApiTags('Quotation')
@Controller({ path: 'quotation', version: '1' })
@Auth()
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @ApiCreatedResponse({ description: 'Creates a Quotation' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @Post()
  create(
    @Body() createQuotationDto: CreateQuotationDto,
    @GetUser() user: UserData,
  ) {
    return this.quotationsService.create(createQuotationDto, user);
  }

  @ApiOkResponse({ description: 'Get all quotations' })
  @Get()
  findAll() {
    return this.quotationsService.findAll();
  }

  @ApiOkResponse({ description: 'Get quotation by id' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  /**
   * Updates the quotation, whatever its status is.
   */
  @ApiOkResponse({ description: 'Updates this quotation' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  @ApiBadRequestResponse({
    description: 'Validation error or trying to update an approved quotation',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() newStatus: UpdateQuotationDto,
    @GetUser() user: UserPayload,
  ) {
    return await this.quotationsService.update(id, newStatus, user);
  }

  @ApiOkResponse({ description: 'Updates the status of this quotation' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  @ApiBadRequestResponse({ description: 'A validation error' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() newStatus: UpdateQuotationStatusDto,
    @GetUser() user: UserData,
  ) {
    return await this.quotationsService.updateStatus(id, newStatus, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(+id);
  }
}
