import { Search, Sun, Moon, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/useApp';

export default function TopNavbar({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const { lang, setLang, theme, toggleTheme, user, products, logout } = useApp();
  const dark = theme === 'dark';
  const [searchText, setSearchText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const matchingProducts = normalizedSearch
    ? products.filter((product) =>
        [product.name, product.name_kv].some((name) => name?.toLocaleLowerCase().includes(normalizedSearch)),
      ).slice(0, 6)
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

  return (
    <header className={`h-16 ${dark ? 'bg-[#07090A] border-[#202829]' : 'bg-white border-slate-200'} border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-20`}>
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[420px]">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className={`md:hidden p-2 rounded-md ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearchOpen(false);
            }}
            placeholder={lang === 'rw' ? 'Shakisha ibicuruzwa...' : 'Search products...'}
            aria-label={lang === 'rw' ? 'Shakisha ibicuruzwa' : 'Search products'}
            aria-expanded={searchOpen && Boolean(normalizedSearch)}
            aria-controls="topbar-product-search-results"
            autoComplete="off"
            className={`w-full rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              dark
                ? 'bg-white/5 text-white placeholder-slate-500 focus:ring-[#08D9C0]'
                : 'bg-slate-100 text-slate-900 placeholder-slate-500 focus:ring-[#087E73]'
            }`}
          />
          {searchOpen && normalizedSearch && (
            <div
              id="topbar-product-search-results"
              className={`absolute top-full left-0 right-0 mt-1 rounded-md border shadow-lg overflow-hidden z-30 ${
                dark ? 'bg-[#101516] border-[#202829]' : 'bg-white border-slate-200'
              }`}
            >
              {matchingProducts.length ? (
                matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => openProduct(product)}
                    className={`w-full px-3 py-2 text-left text-sm ${
                      dark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {product.name}
                    {product.name_kv && product.name_kv !== product.name && (
                      <span className="ml-2 text-xs text-slate-500">{product.name_kv}</span>
                    )}
                  </button>
                ))
              ) : (
                <p className={`px-3 py-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {lang === 'rw'
                    ? 'Nta bicuruzwa bihuye. Kanda Enter ushakishe mu bubiko.'
                    : 'No matching products. Press Enter to search inventory.'}
                </p>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center gap-1 md:gap-3 shrink-0 ml-3">
        <button
          onClick={toggleTheme}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          className={`p-2 rounded-md ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Toggle Dark/Light Mode"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}
          aria-label={lang === 'en' ? 'Switch language to Kinyarwanda' : 'Switch language to English'}
          className={`px-2 py-2 rounded-md text-xs font-medium ${dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {lang === 'en' ? 'RW' : 'EN'}
        </button>

        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${dark ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className={`p-2 rounded-md ${dark ? 'text-slate-400 hover:bg-white/5 hover:text-red-400' : 'text-slate-500 hover:bg-slate-100 hover:text-red-500'}`}
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
