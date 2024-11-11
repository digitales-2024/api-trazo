import { Injectable } from '@nestjs/common';
import { MeetingsTemplate } from './meetings.template';

@Injectable()
export class MeetingsService {
  constructor(private readonly template: MeetingsTemplate) {}

  // métodos para generar el contrato como PDF
  async genPdfLayout(id: string): Promise<string> {
    console.log('meeting id:', id);
    // Get the data

    return await this.template.render();
  }
}
