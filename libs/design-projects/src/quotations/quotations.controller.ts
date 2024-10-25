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
import { UserData } from '@login/login/interfaces';
import { UpdateQuotationStatusDto } from './dto/update-status.dto';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Quotation')
@Controller({ path: 'quotation', version: '1' })
@Auth()
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  create(@Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationsService.create(createQuotationDto);
  }

  @Get()
  findAll() {
    return this.quotationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(+id);
  }

  @ApiOkResponse({ description: 'Updates the status of this quotation' })
  @ApiBadRequestResponse({ description: 'A validation error' })
  @Patch('status/:id')
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
