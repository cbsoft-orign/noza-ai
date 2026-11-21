import { detectIntent, normalizeSpokenUnit, parseQuantityValue, parseVoiceCommand, spokenUnitPattern } from '@/lib/intent';
import { suggestProductUnit, type ProductUnit } from '@/lib/product-units';

type PriceField = 'buying' | 'selling';

export type ShopCommand =
  | { kind: 'STOCK'; productName?: string }
  | { kind: 'CHECK_PRICE'; productName: string }
  | { kind: 'REPORT' | 'UNKNOWN' }
  | { kind: 'SELL' | 'ADD_STOCK'; productName: string; quantity: number; unit?: ProductUnit }
  | {
      kind: 'CREATE_PRODUCT';
      name: string;
      unit: ProductUnit;
      quantity: number;
      buyingPrice: number;
      sellingPrice: number;
    }
  | { kind: 'UPDATE_PRICES'; productName: string; buyingPrice?: number; sellingPrice?: number }
  | { kind: 'INCOMPLETE'; message: string };

const BUYING_PRICE_LABEL = /(?:igiciro\s+(?:cyo\s+)?kugura|igiciro\s+cy['’]?ubuguzi|ikiguzi|kugura|igura|buy(?:ing)?\s+price|cost(?:\s+price)?)/i;
const SELLING_PRICE_LABEL = /(?:igiciro\s+(?:cyo\s+)?kugurisha|igiciro\s+cy['’]?igurisha|kugurisha|igurisha|sell(?:ing)?\s+price)/i;
const PRICE_AMOUNT = '\\s*[^0-9]{0,80}(\\d[\\d,]*(?:\\.\\d+)?)';
const CREATE_PRODUCT_MARKER = /(?:(?:kora|shyiraho|shyiramo|ongeraho|andikisha|create|add)\s+(?:igicuruzwa(?:\s+gishya)?|product(?:\s+new)?|item)|\bigicuruzwa\s+gishya\b|\bnew\s+product\b)/i;

function extractPrice(text: string, field: PriceField): number | undefined {
  const label = field === 'buying' ? BUYING_PRICE_LABEL : SELLING_PRICE_LABEL;
  const match = new RegExp(`${label.source}${PRICE_AMOUNT}`, 'i').exec(text);
  if (!match) return undefined;
  const amountStart = match.index + match[0].lastIndexOf(match[1]);
  if (/-\s*$/.test(text.slice(0, amountStart))) return undefined;
  const value = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function findUnit(text: string): { unit: ProductUnit; index: number } | undefined {
  const expression = new RegExp(`(^|[^a-z])(${spokenUnitPattern})(?=$|[^a-z])`, 'i');
  const match = expression.exec(text);
  if (!match) return undefined;
  const unit = normalizeSpokenUnit(match[2]);
  return unit ? { unit, index: match.index + match[1].length } : undefined;
}

function extractStockQuantity(text: string): number | undefined {
  const match = /(?:stock|ububiko|mu\s+bubiko|quantity|qty|umubare)\s*(?:ni\s*)?([a-z0-9.,]+)/i.exec(text);
  if (!match) return undefined;
  const numeric = Number(match[1].replace(/,/g, ''));
  if (Number.isFinite(numeric) && numeric >= 0) return numeric;
  return parseQuantityValue(match[1]);
}

function cleanProductName(value: string) {
  return value
    .replace(/\b(?:hindura|shyiraho|shyiramo|update|change|set|igiciro|ibiciro|ikiguzi|price|cost)\b/gi, ' ')
    .replace(/igiciro\s+(?:cyo\s+)?(?:kugura|kugurisha)/gi, ' ')
    .replace(/igiciro\s+cy['’]?(?:ubuguzi|igurisha)/gi, ' ')
    .replace(/\b(?:kugura|kugurisha|igura|igurisha|buying|selling|buy|sell|ni|kibe|kuri|cyo|byo)\b/gi, ' ')
    .replace(/\d[\d,.]*/g, ' ')
    .replace(/\b(?:rwf|unit|igipimo|izina|name)\b/gi, ' ')
    .replace(new RegExp(`\\b(?:${spokenUnitPattern})\\b`, 'gi'), ' ')
    .replace(/[^a-zA-ZÀ-ÿ0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCreateProduct(text: string): ShopCommand | undefined {
  const marker = CREATE_PRODUCT_MARKER.exec(text);
  if (!marker) return undefined;

  const details = text.slice(marker.index + marker[0].length).replace(/^[\s:;,.-]+/, '');
  const priceStart = [BUYING_PRICE_LABEL, SELLING_PRICE_LABEL]
    .map((label) => label.exec(details)?.index)
    .filter((index): index is number => index !== undefined);
  const stockStart = /(?:stock|ububiko|mu\s+bubiko|quantity|qty|umubare)\b/i.exec(details)?.index;
  const unitStart = /\b(?:unit|igipimo)\b/i.exec(details)?.index;
  const spokenUnit = findUnit(details);
  const cutPoints = [...priceStart, stockStart, unitStart, spokenUnit?.index]
    .filter((index): index is number => index !== undefined);
  const name = details.slice(0, cutPoints.length ? Math.min(...cutPoints) : details.length)
    .replace(/^[\s:;,.-]+|[\s:;,.-]+$/g, '')
    .replace(/^(?:izina|name)\s+(?:ni\s+)?/i, '')
    .trim();

  const buyingPrice = extractPrice(details, 'buying');
  const sellingPrice = extractPrice(details, 'selling');
  if (!name || buyingPrice === undefined || sellingPrice === undefined) {
    return {
      kind: 'INCOMPLETE',
      message: 'Kugira ngo nongereho igicuruzwa, vuga izina, igipimo, igiciro cyo kugura n’icyo kugurisha. Urugero: “Kora igicuruzwa gishya ibirayi, kg, stock 10, kugura 500, kugurisha 700”.',
    };
  }

  const unit = spokenUnit?.unit ?? suggestProductUnit(name);
  const quantity = extractStockQuantity(details) ?? 0;
  return { kind: 'CREATE_PRODUCT', name, unit, quantity, buyingPrice, sellingPrice };
}

function parsePriceUpdate(text: string): ShopCommand | undefined {
  if (!/\b(?:igiciro|ibiciro|ikiguzi|price|cost)\b/i.test(text)) return undefined;

  const hasBuyingLabel = BUYING_PRICE_LABEL.test(text);
  const hasSellingLabel = SELLING_PRICE_LABEL.test(text);
  if (!hasBuyingLabel && !hasSellingLabel) return undefined;

  const buyingPrice = hasBuyingLabel ? extractPrice(text, 'buying') : undefined;
  const sellingPrice = hasSellingLabel ? extractPrice(text, 'selling') : undefined;
  const productName = cleanProductName(text);
  if (!productName || (hasBuyingLabel && buyingPrice === undefined) || (hasSellingLabel && sellingPrice === undefined)) {
    return {
      kind: 'INCOMPLETE',
      message: 'Vuga izina ry’igicuruzwa n’igiciro gishya. Urugero: “Hindura igiciro cyo kugurisha umuceri 1800” cyangwa “Hindura igiciro cyo kugura umuceri 1500”.',
    };
  }

  return { kind: 'UPDATE_PRICES', productName, buyingPrice, sellingPrice };
}

export { cleanProductName, extractPrice };

function parseCheckPrice(text: string): ShopCommand | undefined {
  if (!/(?:igiciro|ibiciro|bigura\s+angahe|ugura\s+angahe|how\s+much|price)/i.test(text)) return undefined;
  if (BUYING_PRICE_LABEL.test(text) || SELLING_PRICE_LABEL.test(text)) {
    // Might be UPDATE_PRICES, handled elsewhere
    return undefined;
  }
  const match = /(?:igiciro\s+(?:cy'|cya\s+|cyo\s+)?|bigura\s+angahe\s+(?:kuri\s+)?|ugura\s+angahe\s+)?([a-zA-ZÀ-ÿ0-9'\s-]+?)(?:\s+ni\s+angahe|\s+ugura\s+angahe|\s+bigura\s+angahe|\?|$)/i.exec(text)
    || /(?:reba\s+)?igiciro\s+(?:cy'|cya\s+|cyo\s+)?([a-zA-ZÀ-ÿ0-9'\s-]+)/i.exec(text)
    || /(?:price\s+of|how\s+much\s+is)\s+([a-zA-ZÀ-ÿ0-9'\s-]+)/i.exec(text);
  if (!match) return undefined;
  const productName = cleanProductName(match[1]);
  if (!productName) return undefined;
  return { kind: 'CHECK_PRICE', productName };
}

function parseCheckStock(text: string): ShopCommand | undefined {
  if (!/(?:stock|ububiko|hasigaye|ese\s+dufite)/i.test(text)) return undefined;
  const match = /(?:stock\s+(?:y'|ya\s+|cy'|cya\s+)?|hasigaye\s+|ese\s+dufite\s+)([a-zA-ZÀ-ÿ0-9'\s-]+?)(?:\s+angahe|\s+zingahe|\s+yingahe|\?|$)/i.exec(text);
  const productName = match ? cleanProductName(match[1]) : undefined;
  return { kind: 'STOCK', productName: productName || undefined };
}

export function parseShopCommand(text: string, allowImplicitSale = false): ShopCommand {
  const value = text.trim();
  if (!value) return { kind: 'UNKNOWN' };

  const create = parseCreateProduct(value);
  if (create) return create;

  const priceUpdate = parsePriceUpdate(value);
  if (priceUpdate) return priceUpdate;

  const checkPrice = parseCheckPrice(value);
  if (checkPrice) return checkPrice;

  const checkStock = parseCheckStock(value);
  if (checkStock) return checkStock;

  const detected = detectIntent(value);
  if (detected.intent === 'STOCK') return { kind: 'STOCK' };
  if (detected.intent === 'REPORT') return { kind: 'REPORT' };

  const command = parseVoiceCommand(value);
  if (!command) return { kind: 'UNKNOWN' };
  if (detected.intent === 'SELL' || (allowImplicitSale && detected.intent === 'UNKNOWN')) {
    return { kind: 'SELL', ...command };
  }
  if (detected.intent === 'ADD') return { kind: 'ADD_STOCK', ...command };
  return { kind: 'UNKNOWN' };
}
