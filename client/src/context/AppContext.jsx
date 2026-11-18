import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en'); // 'en' | 'rw'
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [shop, setShop] = useState({
    id: 'shop-1',
    name: 'Kigali Duka',
    phone: '250788000001',
    village: 'Nyabugogo',
    plan: 'free',
    credits: 20,
  });
  const [user, setUser] = useState({
    id: 'user-1',
    name: 'Zendaya',
    role: 'owner', // 'owner' | 'worker'
    phone: '250788000001',
  });
  const [products, setProducts] = useState([
    { id: 1, shop_id: 'shop-1', name: 'Umuceri', name_kv: 'umuceri', buying_price: 1200, selling_price: 1500, quantity: 15, unit: 'kg', low_stock_threshold: 5 },
    { id: 2, shop_id: 'shop-1', name: 'Isukari', name_kv: 'isukari', buying_price: 900, selling_price: 1250, quantity: 10, unit: 'kg', low_stock_threshold: 3 },
    { id: 3, shop_id: 'shop-1', name: 'Bread Loaf', name_kv: 'bread loaf', buying_price: 200, selling_price: 350, quantity: 10, unit: 'loaf', low_stock_threshold: 2 },
    { id: 4, shop_id: 'shop-1', name: 'Bread Slice', name_kv: 'bread slice', buying_price: 20, selling_price: 40, quantity: 20, unit: 'slice', low_stock_threshold: 1 },
    { id: 5, shop_id: 'shop-1', name: 'Icyayi', name_kv: 'icyayi', buying_price: 1900, selling_price: 2500, quantity: 8, unit: 'cup', low_stock_threshold: 2 },
  ]);
  const [sales, setSales] = useState([]);
  const [activities, setActivities] = useState([
    { id: 1, type: 'sale', text: 'New sale: RWF 120,000 (Umuceri)', time: '2 min ago' },
    { id: 2, type: 'stock', text: 'Stock updated: Isukari (+10 kg)', time: '5 min ago' },
    { id: 3, type: 'customer', text: 'New shop worker registered', time: '8 min ago' },
  ]);
  const [backendStatus, setBackendStatus] = useState('Checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.ok ? 'Connected (Backend Active)' : 'Offline'))
      .catch(() => setBackendStatus('Connected (Demo Mode)'));

    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.summary) {
          // Sync summary if needed
        }
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addProduct = (newProd) => {
    if (products.length >= 10 && shop.plan === 'free') {
      alert(lang === 'rw' ? 'Wageze ku mpera ya Free Plan (ibicuruzwa 10). Andika ISHYURA 200.' : 'Free plan limit reached (10 products). Please upgrade via MoMo.');
      return false;
    }
    const item = { id: Date.now(), shop_id: shop.id, ...newProd };
    setProducts((prev) => [item, ...prev]);
    setActivities((prev) => [{ id: Date.now(), type: 'stock', text: `Stock updated: ${item.name} (+${item.quantity})`, time: 'Just now' }, ...prev]);
    return true;
  };

  const recordSale = (productId, qty, soldBy = user.role) => {
    const product = products.find((p) => p.id === Number(productId));
    if (!product) return;
    const profit = qty * (product.selling_price - product.buying_price);
    const saleEntry = {
      id: `sale-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      quantity_sold: qty,
      selling_price_at_time: product.selling_price,
      profit,
      sold_by: soldBy,
      created_at: new Date().toISOString(),
    };
    setSales((prev) => [saleEntry, ...prev]);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, quantity: Math.max(0, Number((p.quantity - qty).toFixed(2))) } : p))
    );
    setActivities((prev) => [
      { id: Date.now(), type: 'sale', text: `New sale: RWF ${(qty * product.selling_price).toLocaleString()} (${product.name} x${qty})`, time: 'Just now' },
      ...prev,
    ]);
  };

  const upgradePlan = (planType) => {
    const newPlan = planType === '5000_monthly' ? 'monthly' : 'daily';
    setShop((prev) => ({ ...prev, plan: newPlan, credits: newPlan === 'monthly' ? 200 : 25 }));
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        theme,
        toggleTheme,
        shop,
        setShop,
        user,
        setUser,
        products,
        addProduct,
        sales,
        recordSale,
        activities,
        backendStatus,
        upgradePlan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
