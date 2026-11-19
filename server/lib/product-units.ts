export const PRODUCT_UNITS = [
  'kg',
  'g',
  'l',
  'ml',
  'piece',
  'pack',
  'bottle',
  'bag',
  'bunch',
  'crate',
  'tray',
  'loaf',
  'slice',
  'cup',
  'dozen',
  'box',
  'pair',
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number];

const unitLabels: Record<ProductUnit, string> = {
  kg: 'kg',
  g: 'g',
  l: 'L',
  ml: 'mL',
  piece: 'piece',
  pack: 'pack',
  bottle: 'bottle',
  bag: 'bag',
  bunch: 'bunch',
  crate: 'crate',
  tray: 'tray',
  loaf: 'loaf',
  slice: 'slice',
  cup: 'cup',
  dozen: 'dozen',
  box: 'box',
  pair: 'pair',
};

const pluralUnitLabels: Partial<Record<ProductUnit, string>> = {
  piece: 'pieces',
  pack: 'packs',
  bottle: 'bottles',
  bag: 'bags',
  bunch: 'bunches',
  crate: 'crates',
  tray: 'trays',
  loaf: 'loaves',
  slice: 'slices',
  cup: 'cups',
  dozen: 'dozens',
  box: 'boxes',
  pair: 'pairs',
};

export function formatUnitLabel(unit: string): string {
  return unitLabels[unit as ProductUnit] ?? unit;
}

export function formatUnitAmount(quantity: number, unit: string): string {
  const amount = Number(quantity);
  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(quantity);
  const label = amount === 1
    ? formatUnitLabel(unit)
    : pluralUnitLabels[unit as ProductUnit] ?? formatUnitLabel(unit);
  return `${formattedAmount} ${label}`;
}

const discreteProductUnits = new Set<ProductUnit>([
  'piece',
  'pack',
  'bottle',
  'bag',
  'bunch',
  'crate',
  'tray',
  'loaf',
  'slice',
  'cup',
  'dozen',
  'box',
  'pair',
]);

const unitSuggestions: Array<{ unit: ProductUnit; names: string[] }> = [
  {
    unit: 'kg',
    names: [
      'ibirayi', 'potato', 'potatoes', 'ibijumba', 'sweet potato', 'umuceri', 'rice',
      'isukari', 'amasukari', 'sukari', 'sugar', 'ibishyimbo', 'beans', 'ibigori', 'maize', 'corn', 'ifu',
      'flour', 'umunyu', 'salt', 'inyanya', 'tomati', 'tomato', 'tomatoes', 'igitunguru', 'onion',
      'amapera', 'guava', 'avoka', 'avocado',
    ],
  },
  { unit: 'l', names: ['amavuta', 'oil', 'amata', 'milk'] },
  { unit: 'loaf', names: ['umutsima', 'bread'] },
  { unit: 'pack', names: ['icyayi', 'tea', 'makaroni', 'pasta'] },
  { unit: 'bottle', names: ['amazi', 'water', 'juice', 'soda', 'fanta'] },
  { unit: 'piece', names: ['igi', 'eggs', 'egg', 'isabune', 'soap', 'buji', 'candle'] },
];

export function suggestProductUnit(productName: string): ProductUnit {
  const normalizedName = ` ${productName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  return unitSuggestions.find(({ names }) =>
    names.some((name) => normalizedName.includes(` ${name} `)),
  )?.unit ?? 'piece';
}

export function isDiscreteProductUnit(unit: string): boolean {
  return discreteProductUnits.has(unit as ProductUnit);
}
