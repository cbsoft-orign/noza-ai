import { addSaleEntry, addProduct, createShop, getProductMatches, getProductsByShop, getShopByPhone, isFreePlanExceeded, normalizeProductName, updateProductQuantity } from '@/lib/store';

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

export function detectIntent(text: string) {
  const value = text.trim().toLowerCase();
  if (!value) return { intent: 'UNKNOWN' as const, text };

  if (/(stock\?|ibikuruzwa|stock|ibibanza|imbere)/.test(value)) return { intent: 'STOCK', text };
  if (/(report|raporo|uyu munsi|ibimenyetso|lundi|byumweru)/.test(value)) return { intent: 'REPORT', text };
  if (/(gurisha|gura|kurisha|hagurishije|yagurishije|sale|sell|sold)/.test(value)) return { intent: 'SELL', text };
  if (/(mfite|ongeraho|add|kongeraho|new product|kugura|shyiraho)/.test(value)) return { intent: 'ADD', text };
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

  const productMatch = /([a-zA-Z\s]+?)\s+(?:slice|cup|loaf|kg|piece)?\s*(\d+(?:\.\d+)?)$/i.exec(value);
  if (productMatch) {
    const productName = productMatch[1].trim();
    const quantity = Number(productMatch[2]);
    const product = findClosestProduct(shopId, productName) ?? getProductsByShop(shopId)[0];
    if (!product) return { intent: 'SELL' as const, text: value, items: [] };
    return {
      intent: 'SELL' as const,
      text: value,
      items: [{ productId: product.id, quantity, productName: product.name }],
    };
  }

  const defaultItems = value.split(/\s+/).filter(Boolean);
  if (defaultItems.length >= 2) {
    const productName = defaultItems.slice(0, -1).join(' ');
    const quantity = Number(defaultItems[defaultItems.length - 1]);
    const product = findClosestProduct(shopId, productName) ?? getProductsByShop(shopId)[0];
    if (product) {
      return { intent: 'SELL' as const, text: value, items: [{ productId: product.id, quantity, productName: product.name }] };
    }
  }

  return { intent: 'SELL' as const, text: value, items: [] };
}

export function parseAddRequest(text: string, shopId: string) {
  const normalized = text.trim();
  const pairs = normalized.matchAll(/([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?)\s*/gi);
  const items: Array<{ name: string; quantity: number }> = [];

  for (const match of pairs) {
    const name = match[1].trim();
    const quantity = Number(match[2]);
    if (name && !Number.isNaN(quantity)) items.push({ name, quantity });
  }

  if (items.length >= 2) {
    return { intent: 'ADD' as const, text: normalized, items };
  }

  const productName = normalized.replace(/\d+(?:\.\d+)?/g, '').trim();
  const quantity = Number((normalized.match(/\d+(?:\.\d+)?/) ?? ['0'])[0]);
  return { intent: 'ADD' as const, text: normalized, items: [{ name: productName || 'Product', quantity }] };
}

export function parseStockRequest(text: string, shopId: string) {
  const products = getProductsByShop(shopId);
  if (!products.length) return 'Nta bikoresho birahari.';

  return products
    .slice(0, 10)
    .map((product, index) => `${index + 1}. ${product.name} - ${product.quantity} left - ${money(product.selling_price)}`)
    .join('\n');
}

export function applySale(shopId: string, items: Array<{ productId?: number; quantity: number; productName?: string; name?: string }>, soldBy: 'owner' | 'worker') {
  const productSummaries: string[] = [];
  let totalProfit = 0;

  for (const item of items) {
    const productId = item.productId ?? Number(item.name ?? 0);
    const product = getProductsByShop(shopId).find((candidate) => candidate.id === productId);
    if (!product) continue;

    const unitDelta = product.unit === 'slice' ? 0.1 : product.unit === 'cup' ? 0.1 : product.unit === 'loaf' ? 1 : 1;
    const finalQuantity = item.quantity * unitDelta;
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

    const displayName = item.productName ?? item.name ?? product.name;
    productSummaries.push(`${displayName} ${finalQuantity}`);
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
    unit: 'kg' as const,
    parent_id: null,
    low_stock_threshold: 2,
  };

  addProduct(product);
  return { blocked: false, product, message: `${name} yongewe.` };
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

  return 'Ntago twasobanukiwe. Andika: STOCK, Gurisha umuceri 2, cyangwa Mfite umuceri 10';
}
