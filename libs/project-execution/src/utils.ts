/**
 * Rounds a number to 2 decimals.
 *
 * `0.63648` -> `0.64`
 */
export function roundToTwoDecimals(n: number): number {
  return Math.round(n * 100) / 100;
}

export function roundToFourDecimals(n: number): number {
  return Math.round(n * 10000) / 10000;
}
