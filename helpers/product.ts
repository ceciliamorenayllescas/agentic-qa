export interface ProductSnapshot { name: string; price?: number; }

export interface ProductListingEntry {
  name: string;
  price: string;
  imageAlt: string;
  actions: string[];
}

export function snapshotProducts(names: string[], prices?: number[]): ProductSnapshot[] {
  return names.map((name, index) => ({ name, ...(prices?.[index] === undefined ? {} : { price: prices[index] }) }));
}
