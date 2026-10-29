-- Find Niche persistent production schema.
-- Uses text IDs so the existing catalog's prod-* and cat-* IDs remain valid.
create extension if not exists pgcrypto;
create sequence if not exists public.product_number_seq start with 1 increment by 1;

create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  slug text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  product_number integer not null unique default nextval('public.product_number_seq'),
  slug text not null unique,
  name text not null,
  short_description text not null,
  description text not null default '',
  key_points jsonb not null default '[]'::jsonb,
  useful_for jsonb not null default '[]'::jsonb,
  considerations text not null default '',
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  image_path text not null default '',
  affiliate_url text not null default '',
  marketplace_code varchar(10) not null default 'US',
  status varchar(20) not null default 'draft' check (status in ('draft','published','hidden','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz,
  view_count integer not null default 0,
  click_count integer not null default 0
);
create index if not exists idx_products_public_listing on public.products(status, deleted_at, created_at desc);
create index if not exists idx_products_category on public.products(category_id, status, deleted_at);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_number on public.products(product_number);

create table if not exists public.product_clicks (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  source varchar(50) not null default 'catalog_card' check (source in ('catalog_card','product_detail','related_products','direct')),
  clicked_at timestamptz not null default now()
);
create index if not exists idx_clicks_product_time on public.product_clicks(product_id, clicked_at desc);

create table if not exists public.audit_logs (
  id text primary key,
  action varchar(100) not null,
  details text not null,
  target_id varchar(100),
  actor varchar(50) not null default 'owner',
  timestamp timestamptz not null default now()
);
create index if not exists idx_audit_timestamp on public.audit_logs(timestamp desc);

-- The id column stores the SHA-256 hash of a random session token, never the raw token.
create table if not exists public.admin_sessions (
  id varchar(128) primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ip_hash varchar(64)
);
create index if not exists idx_sessions_expires on public.admin_sessions(expires_at);

create table if not exists public.site_settings (
  id text primary key check (id = 'default'),
  logo_name text not null default 'Find Niche',
  tagline text not null default 'Better Products. Smarter Choices.',
  hero_headline text not null default 'Curated Tech Essentials. Tested Without Bias.',
  hero_subheadline text not null default 'Handpicked EDC, minimalist desk setups, and everyday tech gear with genuine editorial notes and direct Amazon access.',
  announcement text not null default '',
  admin_theme text not null default 'helios',
  public_theme text not null default 'helios',
  apply_to_public boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.site_settings(id) values ('default') on conflict (id) do nothing;

create table if not exists public.admin_config (
  id text primary key check (id = 'default'),
  passcode_hash varchar(64) not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.login_attempts (
  ip_hash varchar(64) primary key,
  attempts integer not null default 0,
  reset_at timestamptz not null
);
create table if not exists public.click_rate_limits (
  ip_hash varchar(64) primary key,
  request_count integer not null default 0,
  reset_at timestamptz not null
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_clicks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_config enable row level security;
alter table public.login_attempts enable row level security;
alter table public.click_rate_limits enable row level security;
