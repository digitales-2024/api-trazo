import { QuotationDataNested } from '@clients/clients/interfaces/quotation.interface';
import { Injectable } from '@nestjs/common';
import * as Fs from 'fs';
import * as Path from 'path';

@Injectable()
export class QuotationTemplate {
  /**
   * Renders the skeleton of a simple html page.
   * It includes the tailwindcss output.
   *
   * @param param0 An object with children to render inside the skeleton
   */
  private static Skeleton({ children }: { children: JSX.Element }) {
    // TODO: On production, compile and include the css file only once
    const tailwindFile = Fs.readFileSync(
      Path.join(process.cwd(), 'static', 'tailwind-output.css'),
    ).toString();

    return (
      <>
        {'<!DOCTYPE html>'}
        <head>
          <style safe>{tailwindFile}</style>
        </head>
        <body style="width: 297mm;">{children}</body>
      </>
    );
  }

  /**
   * Renderiza una cotizacion como una página html
   *
   * @param quotation La cotizacion a renderizar
   * @param quotationVersion El numero de veces que la cotizacion ha sido editada. Se obtiene de la tabla audit
   */
  renderPdf(quotation: QuotationDataNested, quotationVersion: number) {
    return (
      <QuotationTemplate.Skeleton>
        <div class="p-8">
          <QuotationTemplate.header
            quotationCode={quotation.code}
            quotationVersion={quotationVersion}
          />
          <span>text</span>
          <p>HTML rendered with JSX on the server</p>
          <p class="font-black" safe>
            Cotizacion {quotation.name}
          </p>
        </div>
      </QuotationTemplate.Skeleton>
    );
  }

  private static header({
    quotationCode,
    quotationVersion,
  }: {
    quotationCode: string;
    quotationVersion: number;
  }) {
    const date = QuotationTemplate.getDateToday();
    return (
      <header class="border-2 border-black grid grid-cols-[4fr_6fr_4fr]">
        <div>Logo</div>
        <div class="text-center border-l-2 border-r-2 border-black uppercase flex items-center justify-center font-bold">
          Cotización
        </div>
        <div class="grid grid-cols-2 text-center text-sm font-bold">
          <div class="border-b border-r border-black">Código</div>
          <div class="border-b border-black" safe>
            {quotationCode}
          </div>
          <div class="border-b border-r border-black">Versión</div>
          <div class="border-b border-black">{quotationVersion}</div>
          <div class="border-b border-r border-black">Fecha</div>
          <div class="border-b border-black" safe>
            {date}
          </div>
          <div class="border-r border-black">Páginas</div>
          <div>2</div>
        </div>
      </header>
    );
  }

  private static getDateToday(): string {
    const today = new Date();
    const day = today.getDay().toString().padStart(2, '0');
    const month = today.getMonth().toString().padStart(2, '0');
    const year = today.getFullYear().toString().padStart(4, '0');

    return `${day}/${month}/${year}`;
  }
}
