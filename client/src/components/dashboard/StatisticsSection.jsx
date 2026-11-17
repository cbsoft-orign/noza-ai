import StatCard from './StatCard';
import { useApp } from '../../context/useApp';

export default function StatisticsSection({ stats }) {
  const { products, sales } = useApp();

  const totalProductsCount = products.length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.quantity_sold * s.selling_price_at_time, 0) + 3580000;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total Products"
        value={totalProductsCount > 5 ? totalProductsCount : stats.totalProducts}
        growth={stats.growthProducts}
        icon="Package"
        subtitle="Active items in stock"
      />
      <StatCard
        title="Total Sales"
        value={`RWF ${totalSalesRevenue.toLocaleString()}`}
        growth={stats.growthSales}
        icon="ShoppingCart"
        subtitle="Revenue this month"
      />
      <StatCard
        title="Total Customers"
        value={stats.totalCustomers}
        growth={stats.growthCustomers}
        icon="Users"
        subtitle="Active shop shoppers"
      />
    </div>
  );
}
