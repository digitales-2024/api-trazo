import { Controller } from '@nestjs/common';
import { ProjectCharterService } from './project-charter.service';
// import { CreateProjectCharterDto } from './dto/create-project-charter.dto';
// import { UpdateProjectCharterDto } from './dto/update-project-charter.dto';

@Controller('project-charter')
export class ProjectCharterController {
  constructor(private readonly projectCharterService: ProjectCharterService) {}

  // @Post()
  // create(@Body() createProjectCharterDto: CreateProjectCharterDto) {
  //   return this.projectCharterService.create(createProjectCharterDto);
  // }

  // @Get()
  // findAll() {
  //   return this.projectCharterService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.projectCharterService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProjectCharterDto: UpdateProjectCharterDto) {
  //   return this.projectCharterService.update(+id, updateProjectCharterDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.projectCharterService.remove(+id);
  // }
}
