import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { navigationItems } from '../../data/navigationData';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#07090a] text-white flex">
      <Sidebar navigationItems={navigationItems} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 ml-[200px] p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
