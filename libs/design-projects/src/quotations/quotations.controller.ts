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
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { DeleteQuotationsDto } from './dto/delete-quotation.dto';
import { QuotationData } from '@clients/clients/interfaces';
import { QuotationDataNested } from '@clients/clients/interfaces/quotation.interface';

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
  findAll(@GetUser() user: UserPayload): Promise<QuotationData[]> {
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
  async pdfTemplate(): Promise<string> {
    const testQuotation: QuotationDataNested = {
      id: '16eee435-e80f-49d8-a6b7-4ce8fcb36cae',
      name: 'Proyecto de prueba',
      code: 'SGC-P-04-F3',
      description: '',
      status: 'PENDING',
      discount: 0.5,
      totalAmount: 0,
      deliveryTime: 4,
      exchangeRate: 3.85,
      landArea: 250,
      paymentSchedule: '{}',
      integratedProjectDetails: '{}',
      architecturalCost: 3,
      structuralCost: 3.5,
      electricCost: 1.5,
      sanitaryCost: 1.5,
      metering: 750,
      client: { id: '1483fb91-0531-4ab5-9c25-bdcd5130e5cc', name: 'aaa' },
      levels: [
        {
          id: '084a581a-2330-4ba2-9234-807d25840a59',
          name: 'nivel 1',
          spaces: [
            {
              id: '4a5ce796-0ddb-4748-9303-2cf07cc83560',
              name: 'biblioteca',
              amount: 1,
              area: 15,
            },
          ],
        },
      ],
    };

    return await this.quotationsService.genPdfTemplate(testQuotation);
  }

  @Get(':id/pdf')
  genPdf(
    @Param('id') id: string,
    @GetUser() user: UserData,
  ): Promise<StreamableFile> {
    return this.quotationsService.genPdf(id, user);
  }
}
