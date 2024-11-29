import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WorkitemsService } from './workitems.service';
import { CreateWorkitemDto } from './dto/create-workitem.dto';
import { UpdateWorkitemDto } from './dto/update-workitem.dto';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserData } from '@login/login/interfaces';

@ApiTags('WorkItem')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'work-item', version: '1' })
@Auth()
export class WorkitemsController {
  constructor(private readonly workitemsService: WorkitemsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create WorkItem',
    description: 'Creates a WorkItem and its APU, if present',
  })
  create(
    @Body() createWorkitemDto: CreateWorkitemDto,
    @GetUser() user: UserData,
  ) {
    this.workitemsService.create(createWorkitemDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all WorkItems',
    description: 'Returns all WorkItems and some information about their APUs',
  })
  @ApiOkResponse({
    description: 'Get all APUs',
  })
  async findAll(@GetUser() user: UserData) {
    return await this.workitemsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workitemsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkitemDto: UpdateWorkitemDto,
  ) {
    return this.workitemsService.update(+id, updateWorkitemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workitemsService.remove(+id);
  }
}
