import { createContext, useState, useEffect, useRef } from 'react';
import { apiUrl } from '../api';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en'); // 'en' | 'rw'
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [shop, setShop] = useState({
    id: '',
    name: '',
    phone: '',
    village: '',
    plan: 'free',
    credits: 0,
  });
  const [user, setUser] = useState({
    id: '',
    name: '',
    role: 'owner', // 'owner' | 'worker'
    phone: '',
  });
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [activities, setActivities] = useState([]);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const authRequestVersion = useRef(0);

  const acceptAuthentication = (nextShop, nextUser) => {
    authRequestVersion.current += 1;
    setShop(nextShop);
    setUser(nextUser);
    setIsAuthenticated(true);
    setAuthLoading(false);
  };

  const logout = async () => {
    authRequestVersion.current += 1;
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    } finally {
      setIsAuthenticated(false);
      setShop({ id: '', name: '', phone: '', village: '', plan: 'free', credits: 0 });
      setUser({ id: '', name: '', role: 'owner', phone: '' });
      setProducts([]);
      setSales([]);
    }
  };

  const refreshShopData = async () => {
    if (!shop.phone || !isAuthenticated) return;
    const res = await fetch(apiUrl(`/api/shop?phone=${encodeURIComponent(shop.phone)}`), { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Could not refresh shop data.');
    }
    setShop(data.shop);
    setProducts(data.products);
    setSales(data.sales);
  };

  useEffect(() => {
    fetch(apiUrl('/api/health'))
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.ok ? 'Connected (Backend Active)' : 'Offline'))
      .catch(() => setBackendStatus('Offline'));

    const requestVersion = ++authRequestVersion.current;
    fetch(apiUrl('/api/auth/session'), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (requestVersion !== authRequestVersion.current) return;
        if (data.authenticated) {
          setShop(data.shop);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (requestVersion === authRequestVersion.current) setAuthLoading(false);
      })
      .catch(() => {
        if (requestVersion !== authRequestVersion.current) return;
        setIsAuthenticated(false);
        setAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!shop.phone || !isAuthenticated) return;
    fetch(apiUrl(`/api/shop?phone=${encodeURIComponent(shop.phone)}`), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setShop(data.shop);
          setProducts(data.products);
          setSales(data.sales);
        } else if (res.status === 401 || res.status === 403) {
          authRequestVersion.current += 1;
          setIsAuthenticated(false);
          setShop({ id: '', name: '', phone: '', village: '', plan: 'free', credits: 0 });
          setUser({ id: '', name: '', role: 'owner', phone: '' });
          setProducts([]);
          setSales([]);
        }
      })
      .catch(() => {});
  }, [shop.phone, isAuthenticated]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addProduct = async (newProd) => {
    if (products.length >= 10 && shop.plan === 'free') {
      alert(lang === 'rw' ? 'Wageze ku mpera ya Free Plan (ibicuruzwa 10). Andika ISHYURA 200.' : 'Free plan limit reached (10 products). Please upgrade via MoMo.');
      return false;
    }
    try {
      const res = await fetch(apiUrl('/api/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shop_id: shop.id, ...newProd }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || 'Could not add product.');
        return false;
      }
      setProducts((prev) => [data.item, ...prev]);
      setActivities((prev) => [{ id: Date.now(), type: 'stock', text: `Stock updated: ${data.item.name} (+${data.item.quantity})`, time: 'Just now' }, ...prev]);
      return true;
    } catch {
      alert('Backend unavailable. Could not add product.');
      return false;
    }
  };

  const recordSale = async (productId, qty, soldBy = user.role) => {
    const product = products.find((p) => p.id === Number(productId));
    if (!product) return false;
    try {
      const res = await fetch(apiUrl('/api/sales'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shop_id: shop.id, product_id: product.id, quantity: qty, sold_by: soldBy }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || 'Could not record sale.');
        return false;
      }
      setSales((prev) => [data.item, ...prev]);
      setProducts((prev) => prev.map((p) => (p.id === data.product.id ? data.product : p)));
      setActivities((prev) => [
        { id: Date.now(), type: 'sale', text: `New sale: RWF ${(qty * product.selling_price).toLocaleString()} (${product.name} x${qty})`, time: 'Just now' },
        ...prev,
      ]);
      return true;
    } catch {
      alert('Backend unavailable. Could not record sale.');
      return false;
    }
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
        isAuthenticated,
        authLoading,
        acceptAuthentication,
        refreshShopData,
        logout,
        upgradePlan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
