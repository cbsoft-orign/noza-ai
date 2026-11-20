import StatCard from './StatCard';
import { useApp } from '../../context/useApp';
import { getTranslations } from '../../data/translations';

export default function StatisticsSection() {
  const { products, sales, lang } = useApp();
  const t = getTranslations(lang);

  const totalProductsCount = products.length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.quantity_sold * s.selling_price_at_time, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title={t.dashboard.totalProducts}
        value={totalProductsCount}
        growth="0%"
        icon="Package"
        subtitle={t.dashboard.activeItems}
      />
      <StatCard
        title={t.dashboard.totalSales}
        value={`RWF ${totalSalesRevenue.toLocaleString()}`}
        growth="0%"
        icon="ShoppingCart"
        subtitle={t.dashboard.revenueMonth}
      />
      <StatCard
        title={t.dashboard.totalCustomers}
        value="0"
        growth="0%"
        icon="Users"
        subtitle={t.dashboard.activeShoppers}
      />
    </div>
  );
}
