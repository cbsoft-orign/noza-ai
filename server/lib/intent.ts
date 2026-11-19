import { addSaleEntry, addProduct, createShop, getProductMatches, getProductsByShop, getShopByPhone, isFreePlanExceeded, normalizeProductName, updateProductQuantity } from '@/lib/store';
import { formatUnitAmount, formatUnitLabel, isDiscreteProductUnit, suggestProductUnit } from '@/lib/product-units';
import type { ProductUnit } from '@/lib/product-units';

export type IntentType = 'ADD' | 'SELL' | 'STOCK' | 'REPORT' | 'UNKNOWN';

export type DetectedIntent = {
  intent: IntentType;
  text: string;
  amount?: number;
  unit?: string;
  productName?: string;
  productId?: number;
  quantity?: number;
  items?: Array<{ productId?: number; productName?: string; name?: string; quantity: number }>;
};

function money(value: number) {
  return `${value.toLocaleString()} RWF`;
}

function similarity(a: string, b: string) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.8;
  let distance = 0;
  const maxLength = Math.max(x.length, y.length) || 1;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    if (x[i] !== y[i]) distance += 1;
  }
  return 1 - distance / maxLength;
}

function findClosestProduct(shopId: string, query: string) {
  const products = getProductsByShop(shopId);
  let best = null as { product: any; score: number } | null;

  for (const product of products) {
    const score = similarity(normalizeProductName(query), normalizeProductName(product.name));
    if (score > (best?.score ?? 0)) {
      best = { product, score };
    }
  }

  return best?.score && best.score >= 0.45 ? best.product : null;
}

const quantityWords: Record<string, number> = {
  rimwe: 1,
  imwe: 1,
  kimwe: 1,
  umwe: 1,
  kabiri: 2,
  bibiri: 2,
  ebyiri: 2,
  babiri: 2,
  abiri: 2,
  ibiri: 2,
  gatatu: 3,
  bitatu: 3,
  eshatu: 3,
  batatu: 3,
  kane: 4,
  bine: 4,
  enye: 4,
  bane: 4,
  gatanu: 5,
  bitanu: 5,
  eshanu: 5,
  batanu: 5,
  gatandatu: 6,
  bitandatu: 6,
  esheshatu: 6,
  batandatu: 6,
  karindwi: 7,
  birindwi: 7,
  barindwi: 7,
  umunani: 8,
  icyenda: 9,
  icumi: 10,
};

const quantityWordPattern = Object.keys(quantityWords)
  .sort((a, b) => b.length - a.length)
  .join('|');
export const spokenUnitAliases: Record<string, ProductUnit> = {
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogramu: 'kg',
  ibiro: 'kg',
  g: 'g',
  gram: 'g',
  grams: 'g',
  garama: 'g',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  litiro: 'l',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  piece: 'piece',
  pieces: 'piece',
  unit: 'piece',
  units: 'piece',
  igice: 'piece',
  ibice: 'piece',
  pack: 'pack',
  packs: 'pack',
  packet: 'pack',
  packets: 'pack',
  ipaki: 'pack',
  bottle: 'bottle',
  bottles: 'bottle',
  icupa: 'bottle',
  amacupa: 'bottle',
  bag: 'bag',
  bags: 'bag',
  bunch: 'bunch',
  bunches: 'bunch',
  crate: 'crate',
  crates: 'crate',
  tray: 'tray',
  trays: 'tray',
  loaf: 'loaf',
  loaves: 'loaf',
  slices: 'slice',
  slice: 'slice',
  cup: 'cup',
  cups: 'cup',
  dozen: 'dozen',
  dozens: 'dozen',
  box: 'box',
  boxes: 'box',
  pair: 'pair',
  pairs: 'pair',
};
export const spokenUnitPattern = Object.keys(spokenUnitAliases)
  .sort((a, b) => b.length - a.length)
  .join('|');
const quantityPattern = new RegExp(
  `\\b(\\d+(?:\\.\\d+)?|${quantityWordPattern})(?:\\s*(${spokenUnitPattern}))?[.!?]?\\s*$`,
  'i',
);
const trailingUnitPattern = new RegExp(`\\s+(?:${spokenUnitPattern})\\s*$`, 'i');
const commandPrefixPattern = /^(?:(?:ndashaka\s+)?(?:kugurisha|ndagurisha|tugurisha|mugurisha|nagurishije|gurishije|yagurishije|hagurishije|gurisha|gura|sell|sold)|(?:nongeraho|nongeyeho|twongeyeho|ongeraho|ongeramo|ongera|shyiraho|shyiramo|mfite|naguze|nakiriye|twakiriye|twaguze|add))\b\s*/i;

export function parseQuantityValue(value: string): number | undefined {
  const normalized = value.trim().toLowerCase();
  const numeric = Number(normalized.replace(/,/g, ''));
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return quantityWords[normalized];
}

export function normalizeSpokenUnit(value: string): ProductUnit | undefined {
  return spokenUnitAliases[value.trim().toLowerCase()];
}

export function parseVoiceCommand(text: string) {
  const value = text.trim();
  const match = quantityPattern.exec(value);
  if (!match) return null;

  const quantityText = match[1].toLowerCase();
  const quantity = parseQuantityValue(quantityText);
  if (quantity === undefined || quantity <= 0) return null;

  const beforeQuantity = value.slice(0, match.index);
  const prefixUnit = beforeQuantity.match(new RegExp(`\\b(${spokenUnitPattern})\\s*$`, 'i'))?.[1]?.toLowerCase();
  const spokenUnit = match[2]?.toLowerCase() ?? prefixUnit;
  const productName = beforeQuantity
    .replace(trailingUnitPattern, '')
    .replace(commandPrefixPattern, '')
    .trim();
  if (!productName) return null;

  return { productName, quantity, unit: spokenUnit ? normalizeSpokenUnit(spokenUnit) : undefined };
}

export function detectIntent(text: string) {
  const value = text.trim().toLowerCase();
  if (!value) return { intent: 'UNKNOWN' as const, text };

  if (/(stock\?|stock|ibicuruzwa|ibikuruzwa|ububiko|reba\s+(?:stock|ububiko)|mfite\s+iki)/i.test(value)) return { intent: 'STOCK', text };
  if (/(report|raporo|uyu munsi|ibimenyetso|lundi|byumweru)/.test(value)) return { intent: 'REPORT', text };
  if (/(ndashaka\s+kugurisha|kugurisha|ndagurisha|tugurisha|mugurisha|nagurishije|gurishije|yagurishije|hagurishije|gurisha|gura|kurisha|sale|sell|sold)/.test(value)) return { intent: 'SELL', text };
  if (/(nakiriye|twakiriye|naguze|twaguze|ongeraho|ongeramo|ongera|nongeraho|nongeyeho|twongeyeho|add|kongeraho|new product|shyiraho|shyiramo)/.test(value)) return { intent: 'ADD', text };
  if (/\d+x\d+|\d+\s*x\s*\d+/.test(value)) return { intent: 'SELL', text };
  return { intent: 'UNKNOWN', text };
}

export function parseSellRequest(text: string, shopId: string) {
  const value = text.trim();
  const bulkMatches = Array.from(value.matchAll(/(\d+)x(\d+)/gi));
  if (bulkMatches.length > 0) {
    const items = bulkMatches.map((match) => {
      const productId = Number(match[1]);
      const quantity = Number(match[2]);
      const product = getProductsByShop(shopId).find((item) => item.id === productId) ?? null;
      if (!product) return null;
      return { productId: product.id, quantity, productName: product.name };
    }).filter(Boolean) as Array<{ productId: number; quantity: number; productName: string }>;
    return { intent: 'SELL' as const, text: value, items };
  }

  const command = parseVoiceCommand(value);
  if (command) {
    const product = findClosestProduct(shopId, command.productName);
    if (!product) return { intent: 'SELL' as const, text: value, items: [] };
    return {
      intent: 'SELL' as const,
      text: value,
      items: [{ productId: product.id, quantity: command.quantity, productName: product.name }],
    };
  }

  return { intent: 'SELL' as const, text: value, items: [] };
}

export function parseAddRequest(text: string, shopId: string) {
  const normalized = text.trim();
  const withoutPrefix = normalized.replace(commandPrefixPattern, '');
  const pairs = Array.from(withoutPrefix.matchAll(/([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?)\s*/gi));
  if (pairs.length >= 2) {
    return {
      intent: 'ADD' as const,
      text: normalized,
      items: pairs.map((match) => ({ name: match[1].trim(), quantity: Number(match[2]) })),
    };
  }

  const command = parseVoiceCommand(normalized);
  if (command) {
    return {
      intent: 'ADD' as const,
      text: normalized,
      items: [{ name: command.productName, quantity: command.quantity }],
    };
  }

  if (pairs.length === 1) {
    const [name, quantity] = [pairs[0][1].trim(), Number(pairs[0][2])];
    return {
      intent: 'ADD' as const,
      text: normalized,
      items: [{ name, quantity }],
    };
  }

  return { intent: 'ADD' as const, text: normalized, items: [] };
}

export function parseStockRequest(text: string, shopId: string) {
  const products = getProductsByShop(shopId);
  if (!products.length) return 'Nta bikoresho birahari.';

  return products
    .slice(0, 10)
    .map((product, index) => `${index + 1}. ${product.name} - ${formatUnitAmount(product.quantity, product.unit)} left - ${money(product.selling_price)} per ${formatUnitLabel(product.unit)}`)
    .join('\n');
}

export function applySale(shopId: string, items: Array<{ productId?: number; quantity: number; productName?: string; name?: string }>, soldBy: 'owner' | 'worker') {
  const productSummaries: string[] = [];
  let totalProfit = 0;

  for (const item of items) {
    const productId = item.productId ?? Number(item.name ?? 0);
    const product = getProductsByShop(shopId).find((candidate) => candidate.id === productId);
    if (!product) continue;

    const displayName = item.productName ?? item.name ?? product.name;
    if (isDiscreteProductUnit(product.unit) && !Number.isInteger(item.quantity)) {
      productSummaries.push(`${displayName} must be sold in whole ${formatUnitLabel(product.unit)} quantities.`);
      continue;
    }
    const finalQuantity = item.quantity;
    const profit = finalQuantity * (product.selling_price - product.buying_price);
    totalProfit += profit;
    updateProductQuantity(shopId, product.id, -finalQuantity);
    addSaleEntry({
      id: `sale-${Date.now()}-${product.id}`,
      shop_id: shopId,
      product_id: product.id,
      quantity_sold: finalQuantity,
      selling_price_at_time: product.selling_price,
      buying_price_at_time: product.buying_price,
      profit,
      created_at: new Date().toISOString(),
      sold_by: soldBy,
    });

    productSummaries.push(`${displayName}: ${formatUnitAmount(finalQuantity, product.unit)}`);
  }

  return {
    totalProfit,
    summary: productSummaries.length
      ? `${productSummaries.join(', ')} - Inyungu ${money(totalProfit)}`
      : 'Nta gikoresho cyaguritswe.',
  };
}

export function applyAddProduct(shopId: string, name: string, quantity: number) {
  if (isFreePlanExceeded(shopId)) {
    return { blocked: true, message: 'Ubarirwa ku free plan. Andika ISHYURA 200 cyangwa 5000' };
  }

  const product = {
    id: Date.now(),
    shop_id: shopId,
    name,
    name_kv: normalizeProductName(name),
    buying_price: 0,
    selling_price: 0,
    quantity,
    unit: suggestProductUnit(name),
    parent_id: null,
    low_stock_threshold: 2,
  };

  addProduct(product);
  return { blocked: false, product, message: `${formatUnitAmount(quantity, product.unit)} bya ${name} byongewe.` };
}

export function resolveShopPhone(phoneLike: string) {
  if (!phoneLike) return null;
  const normalized = phoneLike.replace(/\D/g, '');
  return getShopByPhone(normalized) ?? getShopByPhone(`250${normalized.replace(/^0+/, '')}`) ?? null;
}

export function responseFromIntent(intent: DetectedIntent, shopId: string) {
  if (intent.intent === 'STOCK') return parseStockRequest('stock', shopId);
  if (intent.intent === 'SELL' && intent.items?.length) {
    const result = applySale(shopId, intent.items, 'owner');
    return result.summary;
  }
  if (intent.intent === 'ADD' && intent.items?.length) {
    return intent.items
      .map((item) => applyAddProduct(shopId, item.name ?? item.productName ?? 'Product', item.quantity))
      .map((result) => result.message)
      .join('\n');
  }

  return 'Tanga igisobanuro cyibanze: STOCK, SELL, ADD, REPORT';
}

export function parseMessageText(shopId: string, message: string) {
  const detection = detectIntent(message);
  if (detection.intent === 'ADD') {
    const parsed = parseAddRequest(message, shopId);
    return responseFromIntent(parsed, shopId);
  }
  if (detection.intent === 'SELL') {
    const parsed = parseSellRequest(message, shopId);
    return responseFromIntent(parsed, shopId);
  }
  if (detection.intent === 'STOCK') return parseStockRequest(message, shopId);
  if (detection.intent === 'REPORT') {
    const date = new Date().toISOString().slice(0, 10);
    return `Uyu munsi: ${money(0)} - Inyungu ${money(0)}`;
  }

  return 'Ntago twasobanukiwe. Andika: STOCK, Gurisha umuceri ibiro bibiri, cyangwa Mfite umuceri 10';
}
