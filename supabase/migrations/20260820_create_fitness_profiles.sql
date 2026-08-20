create table if not exists public.fitness_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null default 'Hipertrofia',
  height_cm numeric(5,2),
  weight_kg numeric(6,2),
  waist_cm numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fitness_profiles_goal_check check (goal in ('Hipertrofia','Emagrecimento','Performance','Saúde e condicionamento'))
);

alter table public.fitness_profiles enable row level security;

create policy "Users can read own fitness profile"
on public.fitness_profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own fitness profile"
on public.fitness_profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own fitness profile"
on public.fitness_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_fitness_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fitness_profiles_updated_at on public.fitness_profiles;
create trigger fitness_profiles_updated_at
before update on public.fitness_profiles
for each row execute function public.set_fitness_profiles_updated_at();
