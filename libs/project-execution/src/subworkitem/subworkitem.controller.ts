import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubworkitemService } from './subworkitem.service';
import { CreateSubworkitemDto } from './dto/create-subworkitem.dto';
import { UpdateSubworkitemDto } from './dto/update-subworkitem.dto';
import { UserData } from '@login/login/interfaces';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DeleteSubWorkItemDto } from './dto/delete-subworkitem.dto';

@ApiTags('SubWorkItem')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'sub-work-item', version: '1' })
@Auth()
export class SubworkitemController {
  constructor(private readonly subworkitemService: SubworkitemService) {}

  @Post()
  @ApiOperation({
    summary: 'Create WorkItem',
    description: 'Creates a WorkItem and its APU, if present',
  })
  async create(
    @Body() createDto: CreateSubworkitemDto,
    @GetUser() user: UserData,
  ) {
    return await this.subworkitemService.create(createDto, user);
  }

  @Get()
  findAll() {
    return this.subworkitemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subworkitemService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit SubWorkItem',
    description: 'Edits a subworkitem by id',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSubworkitemDto: UpdateSubworkitemDto,
    @GetUser() user: UserData,
  ) {
    return await this.subworkitemService.update(id, updateSubworkitemDto, user);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Subworkitem deleted' })
  @ApiOperation({
    summary: 'Delete SubWorkItem',
    description: 'Deletes (sets as inactive) a subworkitem by id',
  })
  async remove(@Param('id') id: string, @GetUser() user: UserData) {
    return await this.subworkitemService.remove(id, user);
  }

  @ApiOkResponse({ description: 'Subworkitems reactivated' })
  @ApiOperation({
    summary: 'Reactivate SubWorkItem',
    description: 'Reactivates all subworkitems by id',
  })
  @Patch('reactivate/all')
  async reactivateAll(
    @GetUser() user: UserData,
    @Body() clients: DeleteSubWorkItemDto,
  ) {
    return await this.subworkitemService.reactivateAll(user, clients);
  }
}
