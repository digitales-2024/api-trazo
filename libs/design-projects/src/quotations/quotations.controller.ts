import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  StreamableFile,
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
import { DeleteQuotationsDto } from './dto/delete-quotation.dto';
import { QuotationSummaryData } from '@clients/clients/interfaces';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@ApiTags('Quotation')
@Controller({ path: 'quotation', version: '1' })
@Auth()
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @ApiCreatedResponse({ description: 'Creates a Quotation' })
  @ApiBadRequestResponse({
    description: 'Validation error, duplicate level name, invalid spaceId',
  })
  @Post()
  create(
    @Body() createQuotationDto: CreateQuotationDto,
    @GetUser() user: UserData,
  ) {
    return this.quotationsService.create(createQuotationDto, user);
  }

  @ApiOkResponse({ description: 'Get all quotations' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<QuotationSummaryData[]> {
    return this.quotationsService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get quotation by id' })
  @ApiNotFoundResponse({ description: 'Quotation not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserData) {
    return this.quotationsService.findOne(id, user);
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
    @Body() updateQuotationDto: UpdateQuotationDto,
    @GetUser() user: UserPayload,
  ) {
    return await this.quotationsService.update(id, updateQuotationDto, user);
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

  @ApiOkResponse({
    description: 'Deletes (sets status to REJECTED) the passed quotations',
  })
  @ApiBadRequestResponse({
    description: 'Validation error or ids not found',
  })
  @Delete('remove/all')
  deactivate(
    @Body() deleteDto: DeleteQuotationsDto,
    @GetUser() user: UserData,
  ) {
    return this.quotationsService.removeAll(deleteDto, user);
  }

  @ApiOkResponse({ description: 'Reactivates the passed quotations' })
  @ApiBadRequestResponse({
    description: 'Validation error or ids not found',
  })
  @Patch('reactivate/all')
  reactivateAll(
    @GetUser() user: UserData,
    @Body() quotations: DeleteQuotationsDto,
  ) {
    return this.quotationsService.reactivateAll(user, quotations);
  }

  @Get(':id/pdflayout')
  async pdfTemplate(
    @Param('id') id: string,
    @GetUser() user: UserData,
  ): Promise<string> {
    return await this.quotationsService.genPdfTemplate(id, user);
  }

  @Get(':id/pdf')
  genPdf(
    @Param('id') id: string,
    @GetUser() user: UserData,
  ): Promise<StreamableFile> {
    return this.quotationsService.genPdf(id, user);
  }
}
