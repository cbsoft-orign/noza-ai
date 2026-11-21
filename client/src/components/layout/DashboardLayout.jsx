import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import MobileBottomNav from './MobileBottomNav';
import { navigationItems } from '../../data/navigationData';
import { useApp } from '../../context/useApp';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, isAuthenticated, authLoading } = useApp();

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#07090A] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#08D9C0] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading NOZA...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#07090A] text-white' : 'bg-slate-50 text-slate-900'} flex transition-colors`}>
      <Sidebar
        navigationItems={navigationItems}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 md:ml-56 lg:ml-60 transition-all">
        <TopNavbar onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Thumb-friendly Mobile Bottom Navigation */}
      <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />
    </div>
  );
}
