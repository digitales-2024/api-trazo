import * as Fs from 'node:fs';
import * as Path from 'path';
import {
  AlignmentType,
  Header,
  HorizontalPositionRelativeFrom,
  IParagraphOptions,
  ImageRun,
  Paragraph,
  ParagraphChild,
  TextRun,
  VerticalPositionRelativeFrom,
  convertMillimetersToTwip,
} from 'docx';

//
// Utilidades para generar precios
//

/**
 * Given a number n, returns it as a string with 2 decimals.
 *
 * E.g.: 120 -> "120.00", 85.5 -> "85.50"
 */
export function twoDecimals(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

const indices = {
  '0': '',
  '1': 'UNO',
  '2': 'DOS',
  '3': 'TRES',
  '4': 'CUATRO',
  '5': 'CINCO',
  '6': 'SEIS',
  '7': 'SIETE',
  '8': 'OCHO',
  '9': 'NUEVE',

  '10': 'DIEZ',
  '11': 'ONCE',
  '12': 'DOCE',
  '13': 'TRECE',
  '14': 'CATORCE',
  '15': 'QUINCE',
  '16': 'DIECISÉIS',
  '17': 'DIECISIETE',
  '18': 'DIECIOCHO',
  '19': 'DIECINUEVE',

  '20': 'VEINTE',
  '2X': 'VEINTI',
  '30': 'TREINTA',
  '3X': 'TREINTA Y ',
  '40': 'CUARENTA',
  '4X': 'CUARENTA Y ',
  '50': 'CINCUENTA',
  '5X': 'CINCUENTA Y ',
  '60': 'SESENTA',
  '6X': 'SESENTA Y ',
  '70': 'SETENTA',
  '7X': 'SETENTA Y ',
  '80': 'OCHENTA',
  '8X': 'OCHENTA Y ',
  '90': 'NOVENTA',
  '9X': 'NOVENTA Y ',

  // centenas
  '000': '',
  '100': 'CIEN',
  '1XX': 'CIENTO ',
  '200': 'DOSCIENTOS',
  '2XX': 'DOSCIENTOS ',
  '300': 'TRESCIENTOS',
  '3XX': 'TRESCIENTOS ',
  '400': 'CUATROCIENTOS',
  '4XX': 'CUATROCIENTOS ',
  '500': 'QUINIENTOS',
  '5XX': 'QUINIENTOS ',
  '600': 'SEISCIENTOS',
  '6XX': 'SEISCIENTOS ',
  '700': 'SETECIENTOS',
  '7XX': 'SETECIENTOS ',
  '800': 'OCHOCIENTOS',
  '8XX': 'OCHOCIENTOS ',
  '900': 'NOVECIENTOS',
  '9XX': 'NOVECIENTOS ',

  // casos especiales
  '1000': 'UN MIL',
};

function numberToText(n: string) {
  // si el numero exacto esta definido,
  // utilizarlos
  if (indices[n] !== undefined) {
    return indices[n];
  }

  // todas las unidades estan definidas.
  // ---
  // decenas
  if (n.length === 2) {
    // aqui se asume que el numero es una decena y una unidad variable,
    // por ejemplo 22, 43, 87.

    // obtener el numero de la decena, unidad y concatenar
    const [decena, unidad] = n.split('');
    const prefijoDecena = indices[decena + 'X'];
    const sufijoUnidad = indices[unidad];

    return prefijoDecena + sufijoUnidad;
  }

  // centenas
  else if (n.length === 3) {
    const centena = n.substring(0, 1);
    const resto = n.substring(1);

    const prefijoCentena = indices[centena + 'XX'];
    const sufijo = numberToText(resto);
    return prefijoCentena + sufijo;
  }

  // miles
  else if (n.length <= 6 && n.length >= 4) {
    // sacar millares y unidades, y transformarlos recursivamente
    const len = n.length;
    const firstSplit = len - 3;
    const millares = n.substring(0, firstSplit);
    const unidades = n.substring(firstSplit);

    return `${numberToText(millares)} MIL ${numberToText(unidades)}`;
  }

  return '----';
}

/**
 * Transforms a number into its spelling using words.
 *
 * 320000 -> "TRES CIENTOS VEINTE MIL CON 00/100 NUEVOS SOLES NO INCLUYE IGV"
 */
export function spellPricing(price: number) {
  const newprice = twoDecimals(price);
  const [whole, centimos] = newprice.split('.');

  return `${numberToText(whole)} CON ${centimos}/100 NUEVOS SOLES NO INCLUYE IGV`;
}

/**
 * Transforms a number into its spelling using words, including taxes.
 *
 * 320000 -> "TRES CIENTOS VEINTE MIL CON 00/100 NUEVOS SOLES"
 */
export function spellPricingWithTaxes(price: number) {
  const newprice = twoDecimals(price);
  const [whole, centimos] = newprice.split('.');

  return `${numberToText(whole)} CON ${centimos}/100 NUEVOS SOLES`;
}

export function spellPricingBudget(price: number) {
  const newprice = twoDecimals(price);
  const [whole, centimos] = newprice.split('.');

  return `${numberToText(whole)} CON ${centimos}/100 NUEVOS SOLES`;
}

//
// Utilidades para la generacion de docx
//

export const FONT = 'Arial';

// To define centimeters in a image's size
export function cm(centimeters: number) {
  return convertMillimetersToTwip((100 * centimeters) / 150);
}

// To define centimeters in a floating image's position
export function cmToEmu(cm: number) {
  return Math.round(cm * 360000);
}

// To define centimeters in a text
export function cmText(cm: number) {
  return Math.round(cm * 567);
}

export function bold(text: string): TextRun {
  return new TextRun({
    text,
    bold: true,
    font: FONT,
  });
}

/**
 * Underline and bold
 */
export function ub(text: string): TextRun {
  return new TextRun({
    text,
    bold: true,
    underline: {},
    font: FONT,
  });
}

/**
 * A single line break, like <br /> in html
 */
export function br(): TextRun {
  return new TextRun({
    text: '',
    break: 1,
  });
}

/**
 * Crea un texto simple
 */
export function t(text: string): TextRun {
  return new TextRun({
    text,
    font: FONT,
  });
}

/**
 * Crea un parrafo justificado, con margenes y espacio entre linea
 */
export function p(
  args: IParagraphOptions,
  children: ParagraphChild[],
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 200,
      after: 200,
      line: 400,
    },
    children,
    ...args,
  });
}

/**
 * Crea un parrafo justificado, con margenes y espacio entre linea normal
 */
export function p_n(
  args: IParagraphOptions,
  children: ParagraphChild[],
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 200,
      after: 200,
      line: 300,
    },
    children,
    ...args,
  });
}

export function p2(
  args: IParagraphOptions,
  children: ParagraphChild[],
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 100,
      after: 100,
      line: 400,
    },
    children,
    ...args,
  });
}

export function p3(
  args: IParagraphOptions,
  children: ParagraphChild[],
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 50,
      after: 50,
      line: 400,
    },
    children,
    ...args,
  });
}

/**
 * Genera una cabecera de docx con el membretado de los contratos.
 */
export function cabeceraMembretada(): Header {
  const membretado = Fs.readFileSync(
    Path.join(process.cwd(), 'static', 'MEMBRETADA_t.png'),
  );

  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            data: membretado,
            type: 'png',
            transformation: {
              width: cm(4),
              height: cm(2.7),
            },
            floating: {
              zIndex: 0,
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
                offset: cmToEmu(16.5),
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                offset: cmToEmu(0.5),
              },
              behindDocument: true,
            },
          }),
        ],
      }),
    ],
  });
}

export function pieDePaginaMembretada(): Header {
  const membretado_b = Fs.readFileSync(
    Path.join(process.cwd(), 'static', 'MEMBRETADA_b.png'),
  );

  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            data: membretado_b,
            type: 'png',
            transformation: {
              width: cm(20),
              height: cm(14),
            },
            floating: {
              zIndex: 0,
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
                offset: cmToEmu(0.5),
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                offset: cmToEmu(15.5),
              },
              behindDocument: true,
            },
          }),
        ],
      }),
    ],
  });
}
