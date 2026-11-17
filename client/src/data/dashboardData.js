export const defaultStats = {
  totalProducts: 1250,
  totalSales: 3580000,
  totalCustomers: 860,
  growthProducts: '+12%',
  growthSales: '+8%',
  growthCustomers: '+10%',
};

export const salesOverviewData = [
  { date: 'Oct 1', sales: 1200000, profit: 320000 },
  { date: 'Oct 8', sales: 1800000, profit: 480000 },
  { date: 'Oct 15', sales: 2400000, profit: 650000 },
  { date: 'Oct 22', sales: 2900000, profit: 810000 },
  { date: 'Oct 31', sales: 3580000, profit: 1050000 },
];

export const stockStatusData = [
  { name: 'In Stock', value: 78, color: '#08d9c0' },
  { name: 'Low Stock', value: 14, color: '#f59e0b' },
  { name: 'Out of Stock', value: 8, color: '#ef4444' },
];

export const initialRecentActivities = [
  { id: 1, type: 'sale', text: 'New sale: RWF 120,000 (Umuceri)', time: '2 min ago' },
  { id: 2, type: 'stock', text: 'Stock updated: Isukari (+10 kg)', time: '5 min ago' },
  { id: 3, type: 'customer', text: 'New shop worker registered', time: '8 min ago' },
];
