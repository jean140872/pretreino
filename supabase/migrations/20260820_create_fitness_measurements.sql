create table if not exists public.fitness_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(6,2),
  waist_cm numeric(5,2),
  body_fat_pct numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists fitness_measurements_user_date_idx
  on public.fitness_measurements(user_id, measured_at desc);

alter table public.fitness_measurements enable row level security;

drop policy if exists "Users can read own fitness measurements" on public.fitness_measurements;
drop policy if exists "Users can insert own fitness measurements" on public.fitness_measurements;
drop policy if exists "Users can update own fitness measurements" on public.fitness_measurements;
drop policy if exists "Users can delete own fitness measurements" on public.fitness_measurements;

create policy "Users can read own fitness measurements"
on public.fitness_measurements for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own fitness measurements"
on public.fitness_measurements for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own fitness measurements"
on public.fitness_measurements for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own fitness measurements"
on public.fitness_measurements for delete to authenticated
using (auth.uid() = user_id);
