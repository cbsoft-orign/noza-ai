import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import StatisticsSection from '../components/dashboard/StatisticsSection';
import SalesLineChart from '../components/charts/SalesLineChart';
import StockDonutChart from '../components/charts/StockDonutChart';
import RecentActivities from '../components/dashboard/RecentActivities';
import QuickActions from '../components/dashboard/QuickActions';
export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <WelcomeHeader />
      <StatisticsSection />

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesLineChart />
        </div>
        <div>
          <StockDonutChart />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <RecentActivities />
        <QuickActions />
      </div>
    </div>
  );
}
