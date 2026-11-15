export const villageCatalog: Record<string, Array<{ name: string; avg_price: number }>> = {
  Nyabugogo: [
    { name: 'Umuceri', avg_price: 1600 },
    { name: 'Isukari', avg_price: 1300 },
    { name: 'Amavuta', avg_price: 1800 },
    { name: 'Icyayi', avg_price: 2500 },
    { name: 'Umutsima', avg_price: 300 },
    { name: 'Amapera', avg_price: 500 },
    { name: 'Amasukari', avg_price: 2100 },
    { name: 'Sukari', avg_price: 1200 },
    { name: 'Poivron', avg_price: 700 },
    { name: 'Tomati', avg_price: 650 },
  ],
  Kicukiro: [
    { name: 'Umuceri', avg_price: 1800 },
    { name: 'Rice', avg_price: 1700 },
    { name: 'Bread', avg_price: 350 },
    { name: 'Tea', avg_price: 2600 },
  ],
};

export function getVillageCatalog(village: string) {
  const normalized = village?.trim() || 'Nyabugogo';
  const items = villageCatalog[normalized] ?? villageCatalog.Nyabugogo;
  return items.slice(0, 50).map((item, index) => ({ ...item, id: index + 1 }));
}
