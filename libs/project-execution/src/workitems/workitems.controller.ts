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
import { WorkItemData } from '../interfaces';
import { DeleteWorkItemDto } from './dto/delete-workitem.dto';

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
  async create(
    @Body() createWorkitemDto: CreateWorkitemDto,
    @GetUser() user: UserData,
  ) {
    return await this.workitemsService.create(createWorkitemDto, user);
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

  @ApiOkResponse({
    description: 'Get WorkItem by id',
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<WorkItemData> {
    return this.workitemsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit WorkItem',
    description: 'Edits a workitem by id',
  })
  async update(
    @Param('id') id: string,
    @Body() updateWorkitemDto: UpdateWorkitemDto,
    @GetUser() user: UserData,
  ) {
    return await this.workitemsService.update(id, updateWorkitemDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete WorkItem',
    description:
      'Deletes (sets as inactive) a workitem by id, and all its descendants',
  })
  async remove(@Param('id') id: string, @GetUser() user: UserData) {
    return await this.workitemsService.remove(id, user);
  }

  @ApiOkResponse({ description: 'Workitems reactivated' })
  @ApiOperation({
    summary: 'Reactivate WorkItem',
    description: 'Reactivates all workitems by id',
  })
  @Patch('reactivate/all')
  async reactivateAll(
    @GetUser() user: UserData,
    @Body() clients: DeleteWorkItemDto,
  ) {
    return await this.workitemsService.reactivateAll(user, clients);
  }
}
