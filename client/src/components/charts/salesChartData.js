function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildSalesChartData(sales, rangeDays, referenceDate = new Date()) {
  const days = [7, 30, 90].includes(rangeDays) ? rangeDays : 30;
  const salesByDate = new Map();
  for (const sale of sales) {
    const soldAt = new Date(sale.created_at);
    if (Number.isNaN(soldAt.getTime())) continue;

    const revenue = Number(sale.quantity_sold) * Number(sale.selling_price_at_time);
    const profit = Number(sale.profit);
    if (!Number.isFinite(revenue) || !Number.isFinite(profit)) continue;

    const key = dateKey(soldAt);
    const total = salesByDate.get(key) ?? { sales: 0, profit: 0, count: 0 };
    total.sales += revenue;
    total.profit += profit;
    total.count += 1;
    salesByDate.set(key, total);
  }

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - days + index + 1);
    const totals = salesByDate.get(dateKey(date)) ?? { sales: 0, profit: 0, count: 0 };
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      ...totals,
    };
  });
}
