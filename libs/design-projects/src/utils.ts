/**
 * Given a number n, returns it as a string with 2 decimals.
 *
 * E.g.: 120 -> "120.00", 85.5 -> "85.50"
 */
export function twoDecimals(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}
