import StatCard from './StatCard';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function StatisticsSection() {
  const { products, sales, lang } = useApp();
  const t = getTranslations(lang);

  const totalProductsCount = products.length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.quantity_sold * s.selling_price_at_time, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <StatCard
        title={t.dashboard.totalProducts}
        value={totalProductsCount}
        growth="Active"
        icon="Package"
        subtitle={t.dashboard.activeItems}
      />
      <StatCard
        title={t.dashboard.totalSales}
        value={`RWF ${totalSalesRevenue.toLocaleString()}`}
        growth={`${sales.length} tx`}
        icon="ShoppingCart"
        subtitle={t.dashboard.revenueMonth}
      />
      <StatCard
        title={lang === 'rw' ? 'Inyungu Yose' : 'Total Net Profit'}
        value={`RWF ${totalProfit.toLocaleString()}`}
        growth="+Profit"
        icon="TrendingUp"
        subtitle={lang === 'rw' ? 'Inyungu yose yinjijwe' : 'Recorded net profit'}
      />
    </div>
  );
}
