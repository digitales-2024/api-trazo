import { Injectable } from '@nestjs/common';
import { UserData } from '@login/login/interfaces';
import { QuotationsService } from '../quotations/quotations.service';
import { ContractsTemplate } from './contracts.template';

@Injectable()
export class ContractsService {
  constructor(
    private readonly quotationService: QuotationsService,
    private readonly template: ContractsTemplate,
  ) {}

  async findOne(id: string, user: UserData): Promise<string> {
    return await this.template.renderContract();
  }
}
