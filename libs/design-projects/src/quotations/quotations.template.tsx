import {
  LevelData,
  QuotationDataNested,
} from '@clients/clients/interfaces/quotation.interface';
import { Injectable } from '@nestjs/common';
import { DesignProjectsTemplate } from '../design-projects.template';
import { spellPricing, twoDecimals } from '../utils';

@Injectable()
export class QuotationTemplate {
  /**
   * Renderiza una cotizacion como una página html
   *
   * @param quotation La cotizacion a renderizar
   * @param quotationVersion El numero de veces que la cotizacion ha sido editada. Se obtiene de la tabla audit
   */
  renderPdf(quotation: QuotationDataNested, quotationVersion: number) {
    // calculate all the neccesary values once
    const totalArea = quotation.levels
      .map(
        (l) => l.spaces.map((space) => space.area).reduce((a, b) => a + b),
        0,
      )
      .reduce((a, b) => a + b, 0);

    const integralProjectDetails =
      quotation.integratedProjectDetails as unknown as Array<IntegralProjectItem>;
    // Cost of each m2 of construction, as a sum of all parts (architectural, structural, etc)
    const pricePerSquareMeter = integralProjectDetails
      .map((item) => item.cost)
      .reduce((acc, next) => acc + next, 0);
    const priceBeforeDiscount = totalArea * pricePerSquareMeter;
    // Final price in USD after discount
    const priceAfterDiscount = priceBeforeDiscount - quotation.discount;
    // The price of each m2, after the discount is applied
    const pricePerSquareMeterDiscounted =
      (priceAfterDiscount * pricePerSquareMeter) / priceBeforeDiscount;
    const finalPriceSoles = priceAfterDiscount * quotation.exchangeRate;

    return (
      <DesignProjectsTemplate.skeleton>
        <div class="px-16">
          <QuotationTemplate.header
            quotationCode={quotation.code}
            quotationPublicCode={quotation.publicCode}
            quotationVersion={quotationVersion}
            quotationCreatedAt={quotation.createdAt}
          />
          <QuotationTemplate.datosProyecto quotation={quotation} />
          <QuotationTemplate.levelsContainer
            quotation={quotation}
            totalArea={totalArea}
          />
          <QuotationTemplate.integralProyect
            items={
              quotation.integratedProjectDetails as unknown as Array<IntegralProjectItem>
            }
            exchangeRate={quotation.exchangeRate}
            discount={quotation.discount}
            pricePerSquareMeter={pricePerSquareMeter}
            pricePerSquareMeterDiscounted={pricePerSquareMeterDiscounted}
            priceAfterDiscount={priceAfterDiscount}
            totalArea={totalArea}
          />
          <QuotationTemplate.projectNotes />
          <div class="h-[3px] w-full bg-black my-8" />
          <QuotationTemplate.executionSchedule
            scheduledDays={quotation.deliveryTime}
          />
          <QuotationTemplate.paymentSchedule
            finalPriceSoles={finalPriceSoles}
            costItems={quotation.paymentSchedule as unknown as Array<CostItem>}
          />
          <QuotationTemplate.finalNotes />
        </div>
      </DesignProjectsTemplate.skeleton>
    );
  }

  private static header({
    quotationCode,
    quotationPublicCode,
    quotationVersion,
    quotationCreatedAt,
  }: {
    quotationCode: string;
    quotationPublicCode: number;
    quotationVersion: number;
    quotationCreatedAt: Date;
  }) {
    const paddedQuotationCodeNumber = quotationPublicCode
      .toString()
      .padStart(3, '0');
    const formattedQuotationCode = `COT-DIS-${paddedQuotationCodeNumber}`;

    return (
      <header class="border-2 border-black grid grid-cols-[4fr_6fr_4fr]">
        <div>Logo</div>
        <div class="text-center border-l-2 border-r-2 border-black uppercase flex items-center justify-center font-bold text-xl">
          Cotización
        </div>
        <div class="grid grid-cols-2 text-center text-sm font-bold">
          <div class="border-b border-r border-black">Código de doc.</div>
          <div class="border-b border-black" safe>
            {quotationCode}
          </div>
          <div class="border-b border-r border-black">Código de cot.</div>
          <div class="border-b border-black" safe>
            {formattedQuotationCode}
          </div>
          <div class="border-b border-r border-black">Versión</div>
          <div class="border-b border-black">{quotationVersion}</div>
          <div class="border-b border-r border-black">Fecha</div>
          <div class="border-b border-black" safe>
            {formatDate(quotationCreatedAt)}
          </div>
          <div class="border-r border-black">Páginas</div>
          <div>{'{{pageCount}}'}</div>
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

  private static levelsContainer(props: {
    quotation: QuotationDataNested;
    totalArea: number;
  }) {
    const availableArea = props.quotation.landArea * 0.65;
    const freeArea = props.quotation.landArea - availableArea;
    const availableAreaStr = twoDecimals(availableArea);
    const freeAreaStr = twoDecimals(freeArea);

    const levelsAreas: Array<[string, number]> = props.quotation.levels.map(
      (level) => [
        level.name,
        level.spaces.map((s) => s.area).reduce((acc, next) => acc + next, 0),
      ],
    );

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
            {twoDecimals(props.totalArea)}
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
    pricePerSquareMeter: number;
    totalArea: number;
    priceAfterDiscount: number;
    pricePerSquareMeterDiscounted: number;
  }) {
    const pricePerSquareMeter = props.pricePerSquareMeter;
    const pricePerSquareMeterDiscounted = props.pricePerSquareMeterDiscounted;
    const totalArea = props.totalArea;
    const discountedPrice = props.priceAfterDiscount;

    return (
      <div>
        <div class="font-bold uppercase">Proyecto integral</div>
        <div class="grid grid-cols-[4fr_1fr_1fr_1fr_2fr] mb-8">
          <span class="font-bold uppercase">Descripción</span>
          <span class="font-bold uppercase text-center">Und</span>
          <span class="font-bold uppercase text-center">Metrado</span>
          <span class="font-bold uppercase text-center">Costo x m2</span>
          <span />

          {props.items.map((i) => (
            <QuotationTemplate.integralProjectItem item={i} />
          ))}

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
            ${twoDecimals(pricePerSquareMeter)}
          </span>
          <span />
          <span />

          <span />
          <span class="text-center uppercase">Descuento</span>
          <span class="text-center uppercase" safe>
            {twoDecimals(totalArea)}
          </span>
          <span class="font-bold uppercase text-center" safe>
            ${twoDecimals(pricePerSquareMeterDiscounted)}
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
        <div class="my-8 grid grid-cols-[7fr_4fr_3fr]">
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

        <div>
          <b safe>SON: {spellPricing(discountedPrice * props.exchangeRate)}</b>
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

  private static projectNotes() {
    return (
      <div class="relative my-8">
        <span class="font-bold absolute -left-12">Nota:&nbsp;</span>
        <p>La entrega del proyecto incluye:</p>
        <p>
          Un juego de planos de arquitectura y detalles con la firma del
          profesional Correspondiente
        </p>
        <p>
          Un juego de planos de Estructuras y detalles, Instalaciones Electricas
          y Sanitarias con las firmas de los profesionales correspondientes
        </p>
        <p>
          Armado del Expediente Tecnico que contiene; Memoria Descriptiva,
          Especificaciones Tecnicas
        </p>
        <p>Fotografias de Maqueta Virtual (3D) en Archivo Digital</p>
      </div>
    );
  }

  private static executionSchedule(props: { scheduledDays: number }) {
    return (
      <div class="my-8 grid grid-cols-[8fr_1fr_2fr_4fr]">
        <p class="font-bold uppercase pb-4">
          Cronograma de ejecución de proyecto
        </p>
        <span />
        <span />
        <span />

        <p class="uppercase pb-8">
          Plazo hasta entrega de expediente al propietario
        </p>
        <span />
        <span class="font-bold uppercase text-center">
          {props.scheduledDays} días
        </span>
        <span />
      </div>
    );
  }

  static paymentSchedule(props: {
    finalPriceSoles: number;
    costItems: Array<CostItem>;
  }) {
    return (
      <div class="my-8 grid grid-cols-[8fr_1fr_2fr_4fr]">
        <p class="font-bold uppercase pb-4">Cronograma de forma de pagos</p>
        <span />
        <span />
        <span />

        {props.costItems.map((i) => {
          const percentageCost = props.finalPriceSoles * (i.percentage / 100);
          return (
            <>
              <p class="uppercase pb-4" safe>
                {i.name}
              </p>
              <span class="text-center">{i.percentage}%</span>
              <span class="text-right font-bold" safe>
                S/. {twoDecimals(percentageCost)}
              </span>
              <span class="text-center text-sm" safe>
                {i.description}
              </span>
            </>
          );
        })}

        <span />
        <span class="text-center">100%</span>
        <span class="text-right font-bold border-t-4 border-black" safe>
          S/. {twoDecimals(props.finalPriceSoles)}
        </span>
        <span />
        <span />
      </div>
    );
  }

  private static finalNotes() {
    return (
      <footer class="uppercase">
        <p class="font-bold">Compromiso del equipo de desarrollo</p>
        <p>
          1.- DESARROLLAR EL PROYECTO HASTA QUE SE ENCUENTRE EL PROPIETARIO
          TOTALMENTE COMPLACIDO
        </p>
        <p>
          2.- CONSTANTES REUNIONES CON LOS PROPIETARIOS PARA COORDINAR EL DISEÑO
          DEL PROYECTO
        </p>
        <p>3.- CUMPLIMIENTO ESTRICTO CON LAS FECHAS ESTABLECIDAS</p>
        <p>
          4.- REUNIONES CONSTANTES CON LOS ACTORES DEL PROYECTO, INGENIEROS
          ESPECIALISTAS
        </p>

        <p class="font-bold mt-8">Obligaciones del propietario</p>
        <p>
          1.- PROPORCIONAR AL PROYECTISTA, LA INFORMACION PERTINENTE, NECESARIA
          PARA ENTREGAR EL EXPEDIENTE
        </p>
        <p>
          2.- PARTICIPAR EN LAS REUNIONES PARA LA TOMA DE DESICIONES SOBRE EL
          PROYECTO
        </p>
        <p>
          3.- SUFRAGAR LOS COSTOS POR CONCEPTOS DE CERTIFICADO DE PARAMETROS Y
          LICENCIA DE OBRA
        </p>
        <p>4.- SUFRAGAR EL COSTO DEL PROYECTO</p>
      </footer>
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

export interface IntegralProjectItem {
  area: number;
  cost: number;
  items: Item[];
  project: string;
}

interface Item {
  unit: string;
  description: string;
}

export interface CostItem {
  cost: number;
  name: string;
  percentage: number;
  description?: string;
}
