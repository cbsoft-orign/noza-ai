import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '../api';
import { formatUnitAmount } from '../data/productUnits';
import { getTranslations } from '../data/translations';

export const AppContext = createContext();

const LANG_STORAGE_KEY = 'noza_lang';

function readSessionLang() {
  try {
    const stored = window.sessionStorage.getItem(LANG_STORAGE_KEY);
    return stored === 'rw' ? 'rw' : 'en';
  } catch {
    return 'en';
  }
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(readSessionLang); // 'en' | 'rw'
  const [theme, setTheme] = useState('light'); // 'dark' | 'light'
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
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const authRequestVersion = useRef(0);
  const shopDataRefreshRef = useRef(null);

  const setLang = useCallback((nextLangOrUpdater) => {
    setLangState((prev) => {
      const resolved = typeof nextLangOrUpdater === 'function' ? nextLangOrUpdater(prev) : nextLangOrUpdater;
      return resolved === 'rw' ? 'rw' : 'en';
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.sessionStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures in restricted browsing contexts
    }
  }, [lang]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const acceptAuthentication = (nextShop, nextUser) => {
    authRequestVersion.current += 1;
    shopDataRefreshRef.current = null;
    setShop(nextShop);
    setUser(nextUser);
    setIsAuthenticated(true);
    setAuthLoading(false);
  };

  const logout = async () => {
    authRequestVersion.current += 1;
    shopDataRefreshRef.current = null;
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

  const refreshShopData = useCallback(async () => {
    if (!shop.phone || !isAuthenticated) return;
    if (shopDataRefreshRef.current) return shopDataRefreshRef.current;

    const requestVersion = authRequestVersion.current;
    const request = (async () => {
      const res = await fetch(apiUrl(`/api/shop?phone=${encodeURIComponent(shop.phone)}`), { credentials: 'include' });
      const data = await res.json();
      if (requestVersion !== authRequestVersion.current) return;
      if (!res.ok || !data.ok) {
        if (res.status === 401 || res.status === 403) {
          authRequestVersion.current += 1;
          setIsAuthenticated(false);
          setShop({ id: '', name: '', phone: '', village: '', plan: 'free', credits: 0 });
          setUser({ id: '', name: '', role: 'owner', phone: '' });
          setProducts([]);
          setSales([]);
        }
        throw new Error(data.message || 'Could not refresh shop data.');
      }
      setShop(data.shop);
      setProducts(data.products);
      setSales(data.sales);
    })();

    shopDataRefreshRef.current = request;
    try {
      await request;
    } finally {
      if (shopDataRefreshRef.current === request) shopDataRefreshRef.current = null;
    }
  }, [shop.phone, isAuthenticated]);

  useEffect(() => {
    fetch(apiUrl('/api/health'))
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.ok ? 'connected' : 'offline'))
      .catch(() => setBackendStatus('offline'));

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
    refreshShopData().catch((error) => console.error('Initial shop data refresh failed', error));
  }, [shop.phone, isAuthenticated, refreshShopData]);

  useEffect(() => {
    if (!shop.phone || !isAuthenticated) return;
    let active = true;
    const refreshVisibleShopData = () => {
      if (!active || document.visibilityState === 'hidden') return;
      refreshShopData().catch((error) => console.error('Automatic shop data refresh failed', error));
    };
    const intervalId = window.setInterval(refreshVisibleShopData, 30_000);
    window.addEventListener('focus', refreshVisibleShopData);
    document.addEventListener('visibilitychange', refreshVisibleShopData);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshVisibleShopData);
      document.removeEventListener('visibilitychange', refreshVisibleShopData);
    };
  }, [shop.phone, isAuthenticated, refreshShopData]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addProduct = async (newProd) => {
    const t = getTranslations(lang);
    if (products.length >= 10 && shop.plan === 'free') {
      alert(t.context.freeLimitAlert);
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
        alert(data.message || t.context.addProductFailed);
        return false;
      }
      setProducts((prev) => [data.item, ...prev]);
      setActivities((prev) => [{
        id: Date.now(),
        type: 'stock',
        text: t.context.stockUpdated(data.item.name, formatUnitAmount(data.item.quantity, data.item.unit, lang)),
        time: t.common.justNow,
      }, ...prev]);
      return true;
    } catch {
      alert(t.context.addProductUnavailable);
      return false;
    }
  };

  const addStock = async (productId, quantity) => {
    const t = getTranslations(lang);
    try {
      const res = await fetch(apiUrl('/api/products'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.message || t.context.addStockFailed);
        return false;
      }
      setProducts((prev) => prev.map((product) => (
        String(product.id) === String(data.item.id) ? data.item : product
      )));
      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'stock',
          text: t.context.stockReceived(data.item.name, formatUnitAmount(quantity, data.item.unit, lang)),
          time: t.common.justNow,
        },
        ...prev,
      ]);
      return true;
    } catch {
      alert(t.context.addStockUnavailable);
      return false;
    }
  };

  const recordSale = async (productId, qty, soldBy = user.role) => {
    const t = getTranslations(lang);
    const product = products.find((p) => String(p.id) === String(productId));
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
        alert(data.message || t.context.recordSaleFailed);
        return false;
      }
      setSales((prev) => [data.item, ...prev]);
      setProducts((prev) => prev.map((p) => (String(p.id) === String(data.product.id) ? data.product : p)));
      setActivities((prev) => [
        {
          id: Date.now(),
          type: 'sale',
          text: t.context.newSale(
            (qty * product.selling_price).toLocaleString(),
            product.name,
            formatUnitAmount(qty, product.unit, lang),
          ),
          time: t.common.justNow,
        },
        ...prev,
      ]);
      return true;
    } catch {
      alert(t.context.recordSaleUnavailable);
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
        addStock,
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
