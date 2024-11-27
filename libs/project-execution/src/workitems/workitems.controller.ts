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

@Controller('workitems')
export class WorkitemsController {
  constructor(private readonly workitemsService: WorkitemsService) {}

  @Post()
  create(@Body() createWorkitemDto: CreateWorkitemDto) {
    return this.workitemsService.create(createWorkitemDto);
  }

  @Get()
  findAll() {
    return this.workitemsService.findAll();
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
