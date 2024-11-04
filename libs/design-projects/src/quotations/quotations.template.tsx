import {
  LevelData,
  QuotationDataNested,
} from '@clients/clients/interfaces/quotation.interface';
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
          <style>
            {`@media print {
            @page {
                size: A4 portrait;
                margin-top: 0.6in;
                margin-bottom: 0.6in;
            }
        }`}
          </style>
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
        <div class="px-16">
          <QuotationTemplate.header
            quotationCode={quotation.code}
            quotationVersion={quotationVersion}
            quotationCreatedAt={quotation.createdAt}
          />
          <QuotationTemplate.datosProyecto quotation={quotation} />
          <QuotationTemplate.levelsContainer quotation={quotation} />
          <QuotationTemplate.integralProyect
            items={
              quotation.integratedProjectDetails as unknown as Array<IntegralProjectItem>
            }
            exchangeRate={quotation.exchangeRate}
            discount={quotation.discount}
          />
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
        <div class="text-center border-l-2 border-r-2 border-black uppercase flex items-center justify-center font-bold text-xl">
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
            {formatDate(quotationCreatedAt)}
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
            <span safe>{formatDate(new Date())}</span>
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

  private static levelsContainer(props: { quotation: QuotationDataNested }) {
    const availableArea = props.quotation.landArea * 0.65;
    const freeArea = props.quotation.landArea - availableArea;
    const availableAreaStr = twoDecimals(availableArea);
    const freeAreaStr = twoDecimals(freeArea);

    const levelsAreas: Array<[string, number]> = props.quotation.levels.map(
      (level) => [
        level.name,
        level.spaces.map((s) => s.area).reduce((acc, next) => acc + next),
      ],
    );
    const totalArea = levelsAreas
      .map((l) => l[1])
      .reduce((acc, next) => acc + next);

    const areasElements = levelsAreas.map((l) => (
      <>
        <span class="uppercase" safe>
          {l[0]}
        </span>
        <span class="text-right" safe>
          {twoDecimals(l[1])}
        </span>
        <span class="pl-16">m2</span>
      </>
    ));

    const levelElements = props.quotation.levels.map((level) => (
      <QuotationTemplate.levelElement level={level} />
    ));

    return (
      <>
        <div class="grid grid-cols-[4fr_5fr_3fr_1fr] py-12 gap-y-8">
          {levelElements}
        </div>
        <div class="grid grid-cols-[20rem_15rem_auto] py-8">
          <div>
            <span class="uppercase">Area construible&nbsp;</span>
            65%
          </div>
          <div class="font-bold text-right" safe>
            {availableAreaStr}
          </div>
          <span class="pl-16 font-bold">m2</span>

          <div>
            <span class="uppercase">Area libre&nbsp;&emsp;&emsp;&emsp;</span>
            45%
          </div>
          <div class="font-bold text-right" safe>
            {freeAreaStr}
          </div>
          <span class="pl-16 font-bold">m2</span>

          <span class="inline-block h-8" />
          <span />
          <span />

          {areasElements}
          <span></span>
          <span class="font-bold text-right" safe>
            {twoDecimals(totalArea)}
          </span>
          <span class="font-bold pl-16">m2</span>
        </div>
      </>
    );
  }

  private static levelElement(props: { level: LevelData }) {
    let levelArea = 0;
    for (const space of props.level.spaces) {
      levelArea += space.area;
    }
    const levelAreaStr = (Math.round(levelArea * 100) / 100).toFixed(2);

    const spaceElements = props.level.spaces.map((space) => (
      <div class="grid grid-cols-[auto_5rem]">
        <div>
          {space.amount}&nbsp;
          <span class="uppercase" safe>
            {space.name}
          </span>
        </div>
        <span class="inline-block text-right" safe>
          {(Math.round(space.area * 100) / 100).toFixed(2)}
        </span>
      </div>
    ));

    return (
      <>
        <span class="uppercase" safe>
          {props.level.name}
        </span>
        <div>{spaceElements}</div>
        <span class="font-bold flex items-end justify-center" safe>
          {levelAreaStr}
        </span>
        <span class="flex items-end justify-center">m2</span>
      </>
    );
  }

  private static integralProyect(props: {
    items: Array<IntegralProjectItem>;
    exchangeRate: number;
    discount: number;
  }) {
    const integralProyectItemElements = props.items.map((i) => (
      <QuotationTemplate.integralProjectItem item={i} />
    ));
    const squareMeterCost = props.items
      .map((item) => item.cost)
      .reduce((acc, next) => acc + next);
    const totalArea = props.items[0]?.area ?? -1;
    const priceBeforeDiscount = props.items
      .map((i) => i.cost * i.area)
      .reduce((acc, next) => acc + next);
    const discountedPrice = priceBeforeDiscount - props.discount;
    const discountedSquareMeterCost =
      (discountedPrice * squareMeterCost) / priceBeforeDiscount;

    return (
      <div>
        <div class="font-bold uppercase">Proyecto integral</div>
        <div class="grid grid-cols-[4fr_1fr_1fr_1fr_2fr] pb-8">
          <span class="font-bold uppercase">Descripción</span>
          <span class="font-bold uppercase text-center">Und</span>
          <span class="font-bold uppercase text-center">Metrado</span>
          <span class="font-bold uppercase text-center">Costo x m2</span>
          <span />

          {integralProyectItemElements}

          <span class="font-bold uppercase">Presupuesto de obra</span>
          <span />
          <span class="text-center">-</span>
          <span class="font-bold uppercase text-center">$0.00</span>
          <span />
        </div>

        <div class="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr]">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span class="text-center uppercase font-bold">Total $</span>

          <span />
          <span class="text-center uppercase">Costo x m2 del proyecto</span>
          <span />
          <span class="font-bold uppercase text-center" safe>
            ${twoDecimals(squareMeterCost)}
          </span>
          <span />
          <span />

          <span />
          <span class="text-center uppercase">Descuento</span>
          <span class="text-center uppercase" safe>
            {twoDecimals(totalArea)}
          </span>
          <span class="font-bold uppercase text-center" safe>
            ${twoDecimals(discountedSquareMeterCost)}
          </span>
          <span />
          <span class="font-bold uppercase text-right" safe>
            ${twoDecimals(discountedPrice)}
          </span>

          <span />
          <span />
          <span />
          <span />
          <span class="uppercase text-center text-sm" safe>
            Taza de cambio {twoDecimals(props.exchangeRate)}
          </span>
          <span class="font-bold uppercase text-right" safe>
            S/. {twoDecimals(discountedPrice * props.exchangeRate)}
          </span>
        </div>
        <div class="py-8 grid grid-cols-[7fr_4fr_3fr]">
          <span />
          <span class="text-center font-bold uppercase">Costo de proyecto</span>
          <div class="text-right">
            <span
              class="inline-block border-4 border-black pl-4 pr-1 font-bold"
              safe
            >
              S/. {twoDecimals(discountedPrice * props.exchangeRate)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  private static integralProjectItem(props: { item: IntegralProjectItem }) {
    return (
      <>
        <div class="font-bold uppercase" safe>
          {props.item.project}
        </div>
        <span />
        <span />
        <span />
        <span />

        <div class="uppercase">
          {props.item.items.map((i) => (
            <p safe>{i.description}</p>
          ))}
        </div>
        <div>
          {props.item.items.map((i) => (
            <p safe>{i.unit}</p>
          ))}
        </div>
        <div class="text-center flex items-center justify-center" safe>
          {twoDecimals(props.item.area)}
        </div>
        <div
          class="font-bold text-center flex items-center justify-center"
          safe
        >
          ${twoDecimals(props.item.cost)}
        </div>
        <span />

        <span class="inline-block h-8" />
        <span />
        <span />
        <span />
        <span />
      </>
    );
  }
}

/**
 * Formats a date to DD/MM/YYYY
 */
function formatDate(d: Date): string {
  const day = d.getDay().toString().padStart(2, '0');
  const month = d.getMonth().toString().padStart(2, '0');
  const year = d.getFullYear().toString().padStart(4, '0');

  return `${day}/${month}/${year}`;
}

/**
 * Given a number n, returns it as a string with 2 decimals.
 *
 * E.g.: 120 -> "120.00", 85.5 -> "85.50"
 */
function twoDecimals(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

interface IntegralProjectItem {
  area: number;
  cost: number;
  items: Item[];
  project: string;
}

interface Item {
  unit: string;
  description: string;
}
