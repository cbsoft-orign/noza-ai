import type { ProductUnit } from '@/lib/product-units';

export type Plan = 'free' | 'daily' | 'monthly';

export type Shop = {
  id: string;
  phone: string;
  name: string;
  village: string;
  created_at: string;
  plan: Plan;
  credits: number;
};

export type Product = {
  id: number;
  shop_id: string;
  name: string;
  name_kv: string;
  buying_price: number;
  selling_price: number;
  quantity: number;
  unit: ProductUnit;
  parent_id: number | null;
  low_stock_threshold: number;
  village?: string;
};

export type Sale = {
  id: string;
  shop_id: string;
  product_id: number;
  quantity_sold: number;
  selling_price_at_time: number;
  buying_price_at_time: number;
  profit: number;
  created_at: string;
  sold_by: 'owner' | 'worker';
};

export type DailyReport = {
  id: string;
  shop_id: string;
  date: string;
  total_sales: number;
  total_profit: number;
  total_items_sold: number;
  stock_value: number;
};

export type Payment = {
  id: string;
  shop_id: string;
  amount: number;
  type: '200_daily' | '5000_monthly';
  status: 'pending' | 'paid';
  momo_ref: string;
};

export type User = {
  id: string;
  shop_id: string;
  phone: string;
  role: 'owner' | 'worker';
  name: string;
};

export const db = {
  shops: [] as Shop[],
  products: [] as Product[],
  users: [] as User[],
  sales: [] as Sale[],
  dailyReports: [] as DailyReport[],
  payments: [] as Payment[],
};


export function getShopByPhone(phone: string) {
  return db.shops.find((shop) => shop.phone === phone);
}

export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('250')) return cleaned;
  if (cleaned.startsWith('0')) return `250${cleaned.slice(1)}`;
  return `250${cleaned}`;
}

export function createShop(phone: string, name = 'New Shop', village = 'Nyabugogo') {
  const shop: Shop = {
    id: `shop-${Date.now()}`,
    phone,
    name,
    village,
    created_at: new Date().toISOString(),
    plan: 'free',
    credits: 20,
  };
  db.shops.push(shop);
  return shop;
}

export function addProduct(product: Product) {
  db.products.push(product);
  return product;
}

export function getProductsByShop(shopId: string) {
  return db.products.filter((product) => product.shop_id === shopId);
}

export function getProductById(shopId: string, productId: number) {
  return getProductsByShop(shopId).find((product) => product.id === productId) ?? null;
}

export function updateProductQuantity(shopId: string, productId: number, delta: number) {
  const product = getProductById(shopId, productId);
  if (!product) return null;
  product.quantity = Number((product.quantity + delta).toFixed(2));
  return product;
}

export function normalizeProductName(productName: string) {
  return productName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isFreePlanExceeded(shopId: string) {
  const products = getProductsByShop(shopId);
  return products.length >= 10;
}

export function getProductMatches(shopId: string, searchTerm: string) {
  const target = normalizeProductName(searchTerm);
  return getProductsByShop(shopId).filter((product) => {
    const candidate = normalizeProductName(product.name);
    return candidate.includes(target) || target.includes(candidate);
  });
}

export function addSaleEntry(sale: Sale) {
  db.sales.push(sale);
  return sale;
}

export function getSalesForDay(shopId: string, date: string) {
  return db.sales.filter((sale) => sale.shop_id === shopId && sale.created_at.startsWith(date));
}

export function getDailyReportForShop(shopId: string, date: string) {
  const sales = getSalesForDay(shopId, date);
  const totalSales = sales.reduce((sum, sale) => sum + sale.quantity_sold * sale.selling_price_at_time, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalItems = sales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
  const stockValue = getProductsByShop(shopId).reduce((sum, product) => sum + product.quantity * product.selling_price, 0);

  return {
    shop_id: shopId,
    date,
    total_sales: Number(totalSales.toFixed(2)),
    total_profit: Number(totalProfit.toFixed(2)),
    total_items_sold: Number(totalItems.toFixed(2)),
    stock_value: Number(stockValue.toFixed(2)),
  };
}

export function createDailyReport(shopId: string, date: string) {
  const report = getDailyReportForShop(shopId, date);
  const existing = db.dailyReports.find((item) => item.shop_id === shopId && item.date === date);
  if (existing) {
    Object.assign(existing, report);
    return existing;
  }
  const newReport: DailyReport = { id: `report-${Date.now()}`, ...report };
  db.dailyReports.push(newReport);
  return newReport;
}

export function setShopPlan(shopId: string, plan: Plan) {
  const shop = db.shops.find((entry) => entry.id === shopId);
  if (!shop) return null;
  shop.plan = plan;
  shop.credits = plan === 'daily' ? 20 : plan === 'monthly' ? 200 : 10;
  return shop;
}

export function createPayment(shopId: string, amount: number, type: Payment['type'], momoRef: string) {
  const payment: Payment = {
    id: `payment-${Date.now()}`,
    shop_id: shopId,
    amount,
    type,
    status: 'paid',
    momo_ref: momoRef,
  };
  db.payments.push(payment);
  const shop = db.shops.find((entry) => entry.id === shopId);
  if (shop) {
    shop.plan = type === '5000_monthly' ? 'monthly' : 'daily';
    shop.credits = type === '5000_monthly' ? 200 : 25;
  }
  return payment;
}
