import StatCard from './StatCard';
import { useApp } from '../../context/useApp';

export default function StatisticsSection() {
  const { products, sales } = useApp();

  const totalProductsCount = products.length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.quantity_sold * s.selling_price_at_time, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total Products"
        value={totalProductsCount}
        growth="0%"
        icon="Package"
        subtitle="Active items in stock"
      />
      <StatCard
        title="Total Sales"
        value={`RWF ${totalSalesRevenue.toLocaleString()}`}
        growth="0%"
        icon="ShoppingCart"
        subtitle="Revenue this month"
      />
      <StatCard
        title="Total Customers"
        value="0"
        growth="0%"
        icon="Users"
        subtitle="Active shop shoppers"
      />
    </div>
  );
}
