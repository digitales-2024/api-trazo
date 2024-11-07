import { Injectable, StreamableFile } from '@nestjs/common';
import { UserData } from '@login/login/interfaces';
import { QuotationsService } from '../quotations/quotations.service';
import { ContractsTemplate } from './contracts.template';
import * as Puppeteer from 'puppeteer';

@Injectable()
export class ContractsService {
  constructor(
    private readonly quotationService: QuotationsService,
    private readonly template: ContractsTemplate,
  ) { }

  async findOne(id: string, user: UserData): Promise<string> {
    return await this.template.renderContract();
  }

  async findOnePdf(id: string, user: UserData): Promise<StreamableFile> {
    // Render the quotation into HTML
    const pdfHtml = await this.template.renderContract();

    // Generar el PDF usando Puppeteer
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(pdfHtml);

    const pdfBufferUint8Array = await page.pdf({
      format: 'A4',
      preferCSSPageSize: true,
    });
    await browser.close();

    return new StreamableFile(pdfBufferUint8Array, {
      type: 'application/pdf',
      disposition: 'attachment; filename="cotizacion_demo_2.pdf"',
    });
  }
}
