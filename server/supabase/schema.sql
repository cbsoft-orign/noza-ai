create extension if not exists pg_trgm;
create extension if not exists fuzzystrmatch;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  village text,
  created_at timestamptz default now(),
  plan text check (plan in ('free', 'daily', 'monthly')) default 'free',
  credits integer default 20
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  name_kv text,
  buying_price numeric(12,2) default 0,
  selling_price numeric(12,2) default 0,
  quantity numeric(12,2) default 0,
  unit text check (unit in ('kg', 'g', 'l', 'ml', 'piece', 'pack', 'bottle', 'bag', 'bunch', 'crate', 'tray', 'loaf', 'slice', 'cup', 'dozen', 'box', 'pair')) default 'kg',
  parent_id uuid references products(id),
  low_stock_threshold numeric(12,2) default 0
);

create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index if not exists idx_products_shop_id on products(shop_id);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  product_id uuid references products(id),
  quantity_sold numeric(12,2) not null,
  selling_price_at_time numeric(12,2),
  buying_price_at_time numeric(12,2),
  profit numeric(12,2),
  created_at timestamptz default now(),
  sold_by text check (sold_by in ('owner', 'worker')) default 'owner'
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  phone text not null,
  role text check (role in ('owner', 'worker')) default 'owner',
  name text
);

create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  date date not null,
  total_sales numeric(12,2) default 0,
  total_profit numeric(12,2) default 0,
  total_items_sold numeric(12,2) default 0,
  stock_value numeric(12,2) default 0
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  amount numeric(12,2),
  type text check (type in ('200_daily', '5000_monthly')),
  status text check (status in ('pending', 'paid')) default 'pending',
  momo_ref text
);
