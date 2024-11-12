import { Injectable } from '@nestjs/common';
import { MeetingsTemplate } from './meetings.template';
import { ProjectService } from '../project/project.service';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly template: MeetingsTemplate,
    private readonly projectService: ProjectService,
  ) {}

  // métodos para generar el contrato como PDF
  async genPdfLayout(id: string): Promise<string> {
    // Get project data from id
    const project = await this.projectService.findByIdNested(id);

    console.log('meeting id:', id);
    // Get the data

    return await this.template.render(project);
  }
}
