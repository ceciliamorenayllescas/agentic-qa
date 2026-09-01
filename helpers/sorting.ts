export function sortStringsAscending(values: readonly string[]): string[] { return [...values].sort((a, b) => a.localeCompare(b)); }
export function sortStringsDescending(values: readonly string[]): string[] { return [...values].sort((a, b) => b.localeCompare(a)); }
export function normalizeNumericText(value: string): number {
  const cleaned = value.trim().replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
  const comma = cleaned.lastIndexOf(','), dot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.', grouping = decimal === ',' ? '.' : ',';
    normalized = cleaned.split(grouping).join('').replace(decimal, '.');
  } else if (comma >= 0) normalized = cleaned.length - comma - 1 === 3 ? cleaned.split(',').join('') : cleaned.replace(',', '.');
  const result = Number(normalized);
  if (!Number.isFinite(result)) throw new Error(`Cannot normalize collection value: ${value}`);
  return result;
}
export function sortNumbersAscending(values: readonly number[]): number[] { return [...values].sort((a, b) => a - b); }
export function sortNumbersDescending(values: readonly number[]): number[] { return [...values].sort((a, b) => b - a); }
