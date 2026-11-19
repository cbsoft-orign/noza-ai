export const productUnits = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Litre (L)' },
  { value: 'ml', label: 'Millilitre (mL)' },
  { value: 'piece', label: 'Piece' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'bag', label: 'Bag' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'crate', label: 'Crate' },
  { value: 'tray', label: 'Tray' },
  { value: 'loaf', label: 'Loaf' },
  { value: 'slice', label: 'Slice' },
  { value: 'cup', label: 'Cup' },
  { value: 'dozen', label: 'Dozen (12 pieces)' },
  { value: 'box', label: 'Box' },
  { value: 'pair', label: 'Pair' },
];

export const discreteProductUnits = new Set([
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

const unitLabels = {
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

const pluralUnitLabels = {
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

export function formatUnitLabel(unit) {
  return unitLabels[unit] || unit;
}

export function formatUnitAmount(quantity, unit) {
  const amount = Number(quantity);
  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(quantity);
  const label = amount === 1 ? formatUnitLabel(unit) : pluralUnitLabels[unit] || formatUnitLabel(unit);
  return `${formattedAmount} ${label}`;
}

const unitSuggestions = [
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

export function suggestProductUnit(productName) {
  const normalizedName = ` ${(productName || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const suggestion = unitSuggestions.find(({ names }) =>
    names.some((name) => normalizedName.includes(` ${name} `)),
  );
  return suggestion?.unit || 'piece';
}
