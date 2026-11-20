export const productUnits = [
  { value: 'kg', label: 'Kilogram (kg)', labelRw: 'Ikiro (kg)' },
  { value: 'g', label: 'Gram (g)', labelRw: 'Garama (g)' },
  { value: 'l', label: 'Litre (L)', labelRw: 'Litiro (L)' },
  { value: 'ml', label: 'Millilitre (mL)', labelRw: 'Mililitiro (mL)' },
  { value: 'piece', label: 'Piece', labelRw: 'Igice' },
  { value: 'pack', label: 'Pack', labelRw: 'Ipaki' },
  { value: 'bottle', label: 'Bottle', labelRw: 'Icupa' },
  { value: 'bag', label: 'Bag', labelRw: 'Umufuka' },
  { value: 'bunch', label: 'Bunch', labelRw: 'Umusatsi / Igishyitsi' },
  { value: 'crate', label: 'Crate', labelRw: 'Ikesi' },
  { value: 'tray', label: 'Tray', labelRw: 'Utrayi' },
  { value: 'loaf', label: 'Loaf', labelRw: 'Umugati' },
  { value: 'slice', label: 'Slice', labelRw: 'Igisate' },
  { value: 'cup', label: 'Cup', labelRw: 'Igikombe' },
  { value: 'dozen', label: 'Dozen (12 pieces)', labelRw: 'Iduzeni (12)' },
  { value: 'box', label: 'Box', labelRw: 'Ikarito' },
  { value: 'pair', label: 'Pair', labelRw: 'Ipari' },
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

const unitLabelsRw = {
  kg: 'kg',
  g: 'g',
  l: 'L',
  ml: 'mL',
  piece: 'igice',
  pack: 'ipaki',
  bottle: 'icupa',
  bag: 'umufuka',
  bunch: 'igishyitsi',
  crate: 'ikesi',
  tray: 'utrayi',
  loaf: 'umugati',
  slice: 'igisate',
  cup: 'igikombe',
  dozen: 'iduzeni',
  box: 'ikarito',
  pair: 'ipari',
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

const pluralUnitLabelsRw = {
  piece: 'ibice',
  pack: 'amapaki',
  bottle: 'amacupa',
  bag: 'imifuka',
  bunch: 'ibishyitsi',
  crate: 'amakesi',
  tray: 'utrayi',
  loaf: 'imigati',
  slice: 'ibisate',
  cup: 'ibikombe',
  dozen: 'amaduzeni',
  box: 'amakarito',
  pair: 'amapari',
};

export function formatUnitLabel(unit, lang = 'en') {
  if (lang === 'rw') return unitLabelsRw[unit] || unit;
  return unitLabels[unit] || unit;
}

export function formatUnitAmount(quantity, unit, lang = 'en') {
  const amount = Number(quantity);
  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(quantity);
  const plurals = lang === 'rw' ? pluralUnitLabelsRw : pluralUnitLabels;
  const label = amount === 1 ? formatUnitLabel(unit, lang) : plurals[unit] || formatUnitLabel(unit, lang);
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
