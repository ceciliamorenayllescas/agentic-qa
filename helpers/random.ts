export interface RandomSource { next(): number; }

export function createSeededRandom(seedText = process.env.TEST_RANDOM_SEED ?? 'agentic-qa'): RandomSource {
  let seed = 0;
  for (const char of seedText) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return { next: () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; } };
}

export function chooseUnique<T>(items: readonly T[], count: number, random = createSeededRandom()): T[] {
  if (!Number.isInteger(count) || count < 0 || count > items.length) throw new Error(`Cannot choose ${count} unique items from ${items.length}.`);
  const pool = [...items];
  const result: T[] = [];
  while (result.length < count) result.push(pool.splice(Math.floor(random.next() * pool.length), 1)[0]);
  return result;
}

export function randomSeed(): string { return process.env.TEST_RANDOM_SEED ?? 'agentic-qa'; }
