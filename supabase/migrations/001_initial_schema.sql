-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TALLERES
-- ============================================================
create table public.talleres (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null,
  rut text not null,
  direccion text not null,
  comuna text not null,
  telefono text not null,
  whatsapp text not null,
  especialidades text[] default '{}',
  horario text default '',
  rating numeric(3,1) default 0,
  verified boolean default false,
  created_at timestamptz default now()
);

alter table public.talleres enable row level security;

create policy "Taller owner full access"
  on public.talleres for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- VEHICULOS
-- ============================================================
create table public.vehiculos (
  id uuid primary key default uuid_generate_v4(),
  patente text not null,
  marca text not null default '',
  modelo text not null default '',
  anio int default null,
  color text default '',
  kms_actuales int default 0,
  aceite_recomendado text default '',
  numero_motor text default '',
  taller_id uuid references public.talleres(id) on delete cascade not null,
  cliente_nombre text default '',
  cliente_whatsapp text default '',
  notas_internas text default '',
  created_at timestamptz default now(),
  unique(patente, taller_id)
);

alter table public.vehiculos enable row level security;

create policy "Vehiculos: taller owner access"
  on public.vehiculos for all
  using (
    taller_id in (select id from public.talleres where user_id = auth.uid())
  )
  with check (
    taller_id in (select id from public.talleres where user_id = auth.uid())
  );

-- ============================================================
-- ORDENES DE TRABAJO
-- ============================================================
create sequence if not exists ot_numero_seq start 1000;

create table public.ordenes_trabajo (
  id uuid primary key default uuid_generate_v4(),
  numero_ot int default nextval('ot_numero_seq') not null,
  taller_id uuid references public.talleres(id) on delete cascade not null,
  vehiculo_id uuid references public.vehiculos(id) on delete restrict not null,
  descripcion_problema text not null default '',
  estado text not null default 'pendiente'
    check (estado in ('pendiente','en_proceso','esperando_repuesto','listo','cerrado')),
  monto_total numeric(12,0) default 0,
  monto_neto numeric(12,0) default 0,
  monto_iva numeric(12,0) default 0,
  link_token uuid default uuid_generate_v4() unique not null,
  aprobado_por_cliente boolean default false,
  aprobado_at timestamptz default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ordenes_trabajo enable row level security;

create policy "OT: taller owner access"
  on public.ordenes_trabajo for all
  using (
    taller_id in (select id from public.talleres where user_id = auth.uid())
  )
  with check (
    taller_id in (select id from public.talleres where user_id = auth.uid())
  );

-- Public read for presupuesto link (by token — no auth needed)
create policy "OT: public read by token"
  on public.ordenes_trabajo for select
  using (true);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_ot_updated_at
  before update on public.ordenes_trabajo
  for each row execute function update_updated_at();

-- ============================================================
-- ITEMS OT
-- ============================================================
create table public.items_ot (
  id uuid primary key default uuid_generate_v4(),
  ot_id uuid references public.ordenes_trabajo(id) on delete cascade not null,
  tipo text not null check (tipo in ('trabajo','repuesto')),
  descripcion text not null,
  cantidad numeric(10,2) default 1,
  precio_unitario numeric(12,0) default 0,
  subtotal numeric(12,0) generated always as (cantidad * precio_unitario) stored
);

alter table public.items_ot enable row level security;

create policy "Items: taller owner access"
  on public.items_ot for all
  using (
    ot_id in (
      select ot.id from public.ordenes_trabajo ot
      join public.talleres t on ot.taller_id = t.id
      where t.user_id = auth.uid()
    )
  )
  with check (
    ot_id in (
      select ot.id from public.ordenes_trabajo ot
      join public.talleres t on ot.taller_id = t.id
      where t.user_id = auth.uid()
    )
  );

create policy "Items: public read"
  on public.items_ot for select
  using (true);

-- ============================================================
-- FOTOS OT
-- ============================================================
create table public.fotos_ot (
  id uuid primary key default uuid_generate_v4(),
  ot_id uuid references public.ordenes_trabajo(id) on delete cascade not null,
  tipo text not null check (tipo in ('diagnostico','salida')),
  url text not null,
  descripcion text default '',
  created_at timestamptz default now()
);

alter table public.fotos_ot enable row level security;

create policy "Fotos: taller owner access"
  on public.fotos_ot for all
  using (
    ot_id in (
      select ot.id from public.ordenes_trabajo ot
      join public.talleres t on ot.taller_id = t.id
      where t.user_id = auth.uid()
    )
  )
  with check (
    ot_id in (
      select ot.id from public.ordenes_trabajo ot
      join public.talleres t on ot.taller_id = t.id
      where t.user_id = auth.uid()
    )
  );

create policy "Fotos: public read"
  on public.fotos_ot for select
  using (true);

-- ============================================================
-- INVENTARIO
-- ============================================================
create table public.inventario (
  id uuid primary key default uuid_generate_v4(),
  taller_id uuid references public.talleres(id) on delete cascade not null,
  nombre text not null,
  codigo_ref text default '',
  categoria text default '',
  stock_actual int default 0,
  stock_minimo int default 1,
  precio_unitario numeric(12,0) default 0,
  proveedor text default '',
  created_at timestamptz default now()
);

alter table public.inventario enable row level security;

create policy "Inventario: taller owner access"
  on public.inventario for all
  using (
    taller_id in (select id from public.talleres where user_id = auth.uid())
  )
  with check (
    taller_id in (select id from public.talleres where user_id = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ot-fotos', 'ot-fotos', true)
on conflict do nothing;

create policy "OT Fotos: public read"
  on storage.objects for select
  using (bucket_id = 'ot-fotos');

create policy "OT Fotos: auth upload"
  on storage.objects for insert
  with check (bucket_id = 'ot-fotos' and auth.role() = 'authenticated');

create policy "OT Fotos: auth delete"
  on storage.objects for delete
  using (bucket_id = 'ot-fotos' and auth.role() = 'authenticated');

-- ============================================================
-- FUNCTION: recalculate OT totals
-- ============================================================
create or replace function recalculate_ot_totals(p_ot_id uuid)
returns void language plpgsql security definer as $$
declare
  v_neto numeric;
  v_iva numeric;
begin
  select coalesce(sum(subtotal), 0) into v_neto
  from public.items_ot
  where ot_id = p_ot_id;

  v_iva := round(v_neto * 0.19);

  update public.ordenes_trabajo
  set
    monto_neto = v_neto,
    monto_iva = v_iva,
    monto_total = v_neto + v_iva
  where id = p_ot_id;
end;
$$;

-- Trigger: recalculate totals on item insert/update/delete
create or replace function trg_recalculate_totals()
returns trigger language plpgsql as $$
begin
  perform recalculate_ot_totals(coalesce(new.ot_id, old.ot_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_items_totals
  after insert or update or delete on public.items_ot
  for each row execute function trg_recalculate_totals();
