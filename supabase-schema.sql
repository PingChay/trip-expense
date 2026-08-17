-- Trip Expense Splitter — Supabase Schema

create table trips (
  id          text primary key,           -- เช่น "ABC-1234"
  name        text not null,
  start_date  date,
  end_date    date,
  created_at  timestamptz default now()
);

create table members (
  id          text primary key default gen_random_uuid()::text,
  trip_id     text not null references trips(id) on delete cascade,
  name        text not null,
  active      boolean default true,
  created_at  timestamptz default now(),
  unique (trip_id, name)
);

create table bills (
  id           text primary key default gen_random_uuid()::text,
  trip_id      text not null references trips(id) on delete cascade,
  title        text not null,
  amount       numeric(12, 2) not null check (amount > 0),
  currency     text not null default 'THB',
  payer_id     text not null references members(id),
  participants text[] not null,             -- snapshot ของ member ids
  date         date default current_date,
  note         text default '',
  created_at   timestamptz default now()
);

-- Indexes
create index on members(trip_id);
create index on bills(trip_id);
create index on bills(payer_id);

-- Enable RLS (Row Level Security) — เปิด public access เพราะไม่มี login
alter table trips   enable row level security;
alter table members enable row level security;
alter table bills   enable row level security;

-- Allow public read/write (no auth required per spec)
create policy "public access" on trips   for all using (true) with check (true);
create policy "public access" on members for all using (true) with check (true);
create policy "public access" on bills   for all using (true) with check (true);
