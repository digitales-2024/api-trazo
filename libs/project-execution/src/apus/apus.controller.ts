import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApusService } from './apus.service';
import { CreateApusDto } from './dto/create-apus.dto';
import { UpdateApusDto } from './dto/update-apus.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData } from '@login/login/interfaces';
import { ApuReturn, ApuReturnNested } from '../interfaces/apu.interfaces';

@ApiTags('Apus')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'apus', version: '1' })
@Auth()
export class ApusController {
  constructor(private readonly apusService: ApusService) {}

  /**
   * Creates an APU from a list of resources.
   */
  @Post()
  @ApiOperation({
    summary: 'Create APU',
    description: 'Creates a new APU from a list of resources',
  })
  @ApiCreatedResponse({
    description: 'APU created successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Duplicated resource IDs, Resource not found, Invalid quantity on resource, Invalid unit cost',
  })
  async create(
    @Body() createApusDto: CreateApusDto,
    @GetUser() user: UserData,
  ) {
    return await this.apusService.create(createApusDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all APUs',
    description: 'Returns all the APUs in the system',
  })
  @ApiOkResponse({
    description: 'Get all APUs',
  })
  async findAll(): Promise<Array<ApuReturn>> {
    return await this.apusService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get APU by id',
    description: 'Returns a single APU by id, or fails',
  })
  @ApiOkResponse({
    description: 'APU found by id',
  })
  @ApiNotFoundResponse({
    description: 'No APU found with the given id',
  })
  async findOne(@Param('id') id: string): Promise<ApuReturnNested> {
    return this.apusService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update APU',
    description:
      'Changes the given fields of this APU. Always performs validation of values.',
  })
  @ApiOkResponse({
    description: 'APU updated',
  })
  async update(
    @Param('id') id: string,
    @Body() updateApusDto: UpdateApusDto,
    @GetUser() user: UserData,
  ) {
    return await this.apusService.update(id, updateApusDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apusService.remove(+id);
  }
}
