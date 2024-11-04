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
            quotationCreatedAt={quotation.createdAt}
          />
          <QuotationTemplate.datosProyecto quotation={quotation} />
        </div>
      </QuotationTemplate.Skeleton>
    );
  }

  private static header({
    quotationCode,
    quotationVersion,
    quotationCreatedAt,
  }: {
    quotationCode: string;
    quotationVersion: number;
    quotationCreatedAt: Date;
  }) {
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
            {QuotationTemplate.formatDate(quotationCreatedAt)}
          </div>
          <div class="border-r border-black">Páginas</div>
          <div>2</div>
        </div>
      </header>
    );
  }

  private static datosProyecto({
    quotation,
  }: {
    quotation: QuotationDataNested;
  }) {
    return (
      <>
        <div class="py-4 grid grid-cols-[5fr_2fr]">
          <div>
            <span class="font-bold uppercase">Proyecto:&nbsp;</span>
            <span safe>{quotation.name}</span>
            <br />
            <span class="font-bold uppercase">Propietario:&nbsp;</span>
            <span class="font-bold" safe>
              {quotation.client.name}
            </span>
          </div>
          <div>
            <span class="font-bold uppercase">Fecha de cotización:&nbsp;</span>
            <span safe>{QuotationTemplate.formatDate(new Date())}</span>
            <br />
            <span class="font-bold uppercase">Plazo de propuesta:&nbsp;</span>
            <span>{quotation.deliveryTime} dias</span>
          </div>
        </div>
        <div class="text-sm">
          <span class="font-bold uppercase">Levantamiento</span>
          <br />
          <div class="grid grid-cols-[1fr_2fr]">
            <span class="uppercase">
              Área del terreno:&nbsp;&emsp;&emsp;&emsp;
            </span>
            <span class="font-bold">{quotation.landArea} m2</span>
            <span class="uppercase">
              Descripción del proyecto:&nbsp;&emsp;&emsp;&emsp;
            </span>
            <span class="uppercase" safe>
              {quotation.description}
            </span>
          </div>
        </div>
      </>
    );
  }

  /**
   * Formats a date to DD/MM/YYYY
   */
  private static formatDate(d: Date): string {
    const day = d.getDay().toString().padStart(2, '0');
    const month = d.getMonth().toString().padStart(2, '0');
    const year = d.getFullYear().toString().padStart(4, '0');

    return `${day}/${month}/${year}`;
  }
}
