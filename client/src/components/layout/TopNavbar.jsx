import { Search, Sun, Moon, Menu, LogOut, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';
import { formatUnitAmount } from '../../data/productUnits';
import LanguageSwitcher from '../common/LanguageSwitcher';

export default function TopNavbar({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const { lang, theme, toggleTheme, user, products, logout } = useApp();
  const dark = theme === 'dark';
  const t = getTranslations(lang);
  const [searchText, setSearchText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const matchingProducts = normalizedSearch
    ? products
        .filter((product) =>
          [product.name, product.name_kv].some((name) =>
            name?.toLocaleLowerCase().includes(normalizedSearch),
          ),
        )
        .slice(0, 6)
    : [];

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!normalizedSearch) return;
    setSearchOpen(false);
    navigate(`/products?search=${encodeURIComponent(searchText.trim())}`);
  };

  const openProduct = (product) => {
    setSearchText(product.name);
    setSearchOpen(false);
    navigate(`/products?search=${encodeURIComponent(product.name)}`);
  };

  const clearSearch = () => {
    setSearchText('');
    searchInputRef.current?.focus();
  };

  return (
    <header
      className={`h-16 ${
        dark ? 'bg-[#07090A]/95 border-[#202829]' : 'bg-white/95 border-slate-200'
      } border-b px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md transition-colors`}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-md">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label={t.common.openMenu}
          className={`md:hidden p-2 rounded-xl transition ${
            dark
              ? 'text-slate-300 hover:bg-white/10 active:bg-white/15'
              : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <form
          onSubmit={handleSearch}
          onFocus={() => setSearchOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
          }}
          className="relative w-full"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearchOpen(false);
            }}
            placeholder={t.nav.searchPlaceholder}
            aria-label={t.nav.searchAria}
            aria-expanded={searchOpen && Boolean(normalizedSearch)}
            aria-controls="topbar-product-search-results"
            autoComplete="off"
            className={`w-full rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 ${
              dark
                ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-[#08D9C0]/30 focus:border-[#08D9C0]'
                : 'bg-slate-100/80 border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-[#087E73]/20 focus:border-[#087E73]'
            }`}
          />
          {searchText && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {searchOpen && normalizedSearch && (
            <div
              id="topbar-product-search-results"
              className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-40 max-h-72 overflow-y-auto animate-fadeIn ${
                dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
              }`}
            >
              {matchingProducts.length ? (
                matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => openProduct(product)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm border-b last:border-b-0 transition flex items-center justify-between ${
                      dark
                        ? 'border-[#202829] text-slate-200 hover:bg-white/5'
                        : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-semibold">{product.name}</span>
                      {product.name_kv && product.name_kv !== product.name && (
                        <span className="ml-2 text-xs text-slate-400 font-normal">({product.name_kv})</span>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className={`font-bold ${dark ? 'text-[#08D9C0]' : 'text-[#087E73]'}`}>
                        RWF {Number(product.selling_price).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatUnitAmount(product.quantity, product.unit, lang)} in stock
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className={`px-4 py-3 text-xs sm:text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.nav.noSearchMatches}
                </p>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? t.common.switchToLight : t.common.switchToDark}
          className={`p-2 rounded-xl transition ${
            dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title={dark ? t.common.switchToLight : t.common.switchToDark}
        >
          {dark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
        </button>

        <LanguageSwitcher compact />

        <div
          title={user?.name}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
            dark
              ? 'bg-[#101516] border-[#08D9C0]/40 text-[#08D9C0]'
              : 'bg-teal-50 border-teal-200 text-[#087E73]'
          }`}
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label={t.common.signOut}
          className={`p-2 rounded-xl transition ${
            dark
              ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'
              : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
          }`}
          title={t.common.signOut}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
