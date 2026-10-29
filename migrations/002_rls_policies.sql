-- Public access is read-only and restricted to active categories and published products.
-- All privileged reads/writes go through the Find Niche Edge Function using a server-side service key.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_clicks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_config enable row level security;
alter table public.login_attempts enable row level security;
alter table public.click_rate_limits enable row level security;

drop policy if exists "Find Niche public active categories" on public.categories;
create policy "Find Niche public active categories"
  on public.categories for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Find Niche public published products" on public.products;
create policy "Find Niche public published products"
  on public.products for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

drop policy if exists "Find Niche public click insert" on public.product_clicks;
create policy "Find Niche public click insert"
  on public.product_clicks for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published' and p.deleted_at is null
    )
  );

-- Do not add client-facing policies to admin_sessions, admin_config, login_attempts,
-- click_rate_limits, or audit_logs. The Edge Function's service role is server-only.
