export interface ProductSnapshot { name: string; price?: number; }

export function snapshotProducts(names: string[], prices?: number[]): ProductSnapshot[] {
  return names.map((name, index) => ({ name, ...(prices?.[index] === undefined ? {} : { price: prices[index] }) }));
}
