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

// "1" -> "UNO"
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

export function spellPricing(price: number) {
  const newprice = twoDecimals(price);
  const [whole, centimos] = newprice.split('.');

  return `${numberToText(whole)} CON ${centimos}/100 NUEVOS SOLES NO INCLUYE IGV`;
}

export function spellPricingBudget(price: number) {
  const newprice = twoDecimals(price);
  const [whole, centimos] = newprice.split('.');

  return `${numberToText(whole)} CON ${centimos}/100 NUEVOS SOLES`;
}
