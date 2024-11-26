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
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Apus')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'apus', version: '1' })
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
    // type: CreateResourceDto,
  })
  create(@Body() createApusDto: CreateApusDto) {
    return this.apusService.create(createApusDto);
  }

  @Get()
  findAll() {
    return this.apusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApusDto: UpdateApusDto) {
    return this.apusService.update(+id, updateApusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apusService.remove(+id);
  }
}
