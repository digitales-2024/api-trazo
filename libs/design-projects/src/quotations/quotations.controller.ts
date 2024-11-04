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
      code: 'SGC-P-04-F5',
      description:
        'Se planifica diseño de una vivienda multifamiliar con condiciones programaticas entregadas por el propietario',
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
      createdAt: new Date('2023-12-02'),
      client: { id: '1483fb91-0531-4ab5-9c25-bdcd5130e5cc', name: 'aaa' },
      levels: [
        {
          id: '9d2939cf-c24c-4b5e-9d91-fcb3be16f82f',
          name: 'Semisotano',
          spaces: [
            {
              id: '3a045f24-9999-49ed-aaaf-25e78fab8ef7',
              name: 'cochera',
              amount: 1,
              area: 56,
            },
            {
              id: '3cdf5b06-3ed4-48e8-8048-a3281ba48965',
              name: 'patio de maniobras',
              amount: 1,
              area: 80,
            },
            {
              id: 'd330a92c-8ac8-4f18-96f9-6fd593c039f3',
              name: 'hall de ingreso',
              amount: 1,
              area: 4,
            },
            {
              id: '03871056-6263-43d2-a965-6c7d90b84237',
              name: 'ascensor',
              amount: 1,
              area: 3,
            },
            {
              id: '6c72276c-ca49-4666-bb19-22dee6fb9c21',
              name: 'gradas exteriores',
              amount: 1,
              area: 14,
            },
          ],
        },
        {
          id: '02c68724-9982-4607-82a1-ccbf610af9ac',
          name: 'Primer nivel',
          spaces: [
            {
              id: 'cd4c9405-dd61-4b37-8e1b-84f6464aef46',
              name: 'hall de ingreso',
              amount: 1,
              area: 4,
            },
            {
              id: '3ff9be19-6683-4103-b447-77a1b3bbf9c1',
              name: 'gradas exteriores',
              amount: 1,
              area: 14,
            },
            {
              id: '1d557ef1-fbd8-49f6-9cd5-620dcbf9e571',
              name: 'ascensor',
              amount: 1,
              area: 3,
            },
            {
              id: '713d2f14-e9a8-4bb4-92b8-9580cb72a729',
              name: 'sala comedor',
              amount: 1,
              area: 30,
            },
            {
              id: '54fa90bb-dd81-417b-9e3b-9ee749b75983',
              name: 'cocina',
              amount: 1,
              area: 11,
            },
            {
              id: 'e143eba0-f71c-4270-8f78-350a5e4f0643',
              name: 'dormitorio principal',
              amount: 1,
              area: 14,
            },
            {
              id: 'eabac11e-13c5-42af-adcb-0b9513b458c3',
              name: 'baño privado',
              amount: 1,
              area: 6,
            },
            {
              id: '55f5c359-c0c4-42a5-8a7e-115b2f518616',
              name: 'dormitorio secundario',
              amount: 2,
              area: 44,
            },
            {
              id: '2a14e381-df40-4d38-a1f0-b6ac43fd5eb6',
              name: 'baño secundario',
              amount: 1,
              area: 5,
            },
          ],
        },
        {
          id: '9c264238-8bc9-4d6d-ab55-85070b297f26',
          name: 'Segundo nivel',
          spaces: [
            {
              id: '584a49ec-dc1f-47ef-b1b2-6c662a63998e',
              name: 'hall de ingreso',
              amount: 1,
              area: 4,
            },
            {
              id: '5bd00a68-2a0c-48d3-8125-9add74c0507d',
              name: 'gradas exteriores',
              amount: 1,
              area: 14,
            },
            {
              id: 'f887baaa-9872-4201-b975-181deee398fc',
              name: 'ascensor',
              amount: 1,
              area: 3,
            },
            {
              id: 'ac4496c4-b3d1-46a8-8693-b0cef37605b7',
              name: 'sala comedor',
              amount: 1,
              area: 30,
            },
            {
              id: '7a24b24e-8f03-465d-b069-4a7621439370',
              name: 'cocina',
              amount: 1,
              area: 11,
            },
            {
              id: '8089fbdf-b0d2-4f3f-8ad7-87c17ded4d18',
              name: 'dormitorio principal',
              amount: 1,
              area: 14,
            },
            {
              id: 'e33c2fe7-d90d-4280-8781-e582c278adc2',
              name: 'baño privado',
              amount: 1,
              area: 6,
            },
            {
              id: '2aced90f-e3ca-4935-90f2-b681942c8417',
              name: 'dormitorio secundario',
              amount: 2,
              area: 44,
            },
            {
              id: '7535dfde-ee86-4c91-81d6-f0b0959f482e',
              name: 'baño secundario',
              amount: 1,
              area: 5,
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
