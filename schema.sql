-- Tables principales
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'titulaire', 'remplacant')),
  priority_index int,
  created_at timestamptz default now()
);

create table if not exists shift_columns (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  allowed_remplacant boolean default false,
  created_at timestamptz default now()
);

create table if not exists shift_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  shift_column_id uuid references shift_columns(id) on delete cascade,
  priority int not null,
  note text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_shift_preferences_profile on shift_preferences(profile_id);
create index if not exists idx_shift_preferences_shift on shift_preferences(shift_column_id);

-- RLS de base (sélectives mais souples)
alter table profiles enable row level security;
alter table shift_columns enable row level security;
alter table shift_preferences enable row level security;

-- Profils : chaque utilisateur lit sa fiche, les admins tout le monde
create policy if not exists profiles_self_read on profiles
  for select using (auth.uid() = id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Profils : admins peuvent insérer / mettre à jour
create policy if not exists profiles_admin_manage on profiles
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Colonnes de planning : lecture pour tous les utilisateurs connectés
create policy if not exists shift_columns_read on shift_columns for select using (auth.role() = 'authenticated');
-- Gestion réservée aux admins
create policy if not exists shift_columns_admin on shift_columns for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Souhaits : chaque utilisateur gère ses lignes
create policy if not exists shift_preferences_crud on shift_preferences
  for all using (auth.uid() = profile_id);

