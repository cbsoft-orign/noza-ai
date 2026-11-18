import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { navigationItems } from '../../data/navigationData';
import { useApp } from '../../context/useApp';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, isAuthenticated, authLoading } = useApp();

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#07090A] text-white' : 'bg-slate-50 text-slate-900'} flex transition-colors`}>
      <Sidebar navigationItems={navigationItems} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 md:ml-[200px] p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
