create table if not exists public.rooms (
  code text primary key,
  host_user_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_code text not null references public.rooms(code) on delete cascade,
  user_id uuid not null,
  name text not null,
  joined_at timestamptz not null default now(),
  primary key (room_code, user_id)
);

create table if not exists public.room_state (
  room_code text primary key references public.rooms(code) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.client_actions (
  id bigserial primary key,
  room_code text not null references public.rooms(code) on delete cascade,
  user_id uuid not null,
  action jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.private_messages (
  id bigserial primary key,
  room_code text not null references public.rooms(code) on delete cascade,
  recipient_user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_state enable row level security;
alter table public.client_actions enable row level security;
alter table public.private_messages enable row level security;

create policy rooms_insert_host on public.rooms
  for insert
  with check (host_user_id = auth.uid());

create policy rooms_select_members on public.rooms
  for select
  using (
    host_user_id = auth.uid()
    or exists (
      select 1
      from public.room_members m
      where m.room_code = rooms.code
        and m.user_id = auth.uid()
    )
  );

create policy members_insert_self on public.room_members
  for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.rooms r where r.code = room_code)
  );

create policy members_update_self on public.room_members
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy members_select_room on public.room_members
  for select
  using (
    exists (
      select 1
      from public.room_members m
      where m.room_code = room_members.room_code
        and m.user_id = auth.uid()
    )
  );

create policy state_insert_host on public.room_state
  for insert
  with check (
    exists (
      select 1
      from public.rooms r
      where r.code = room_code
        and r.host_user_id = auth.uid()
    )
  );

create policy state_update_host on public.room_state
  for update
  using (
    exists (
      select 1
      from public.rooms r
      where r.code = room_state.room_code
        and r.host_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.rooms r
      where r.code = room_state.room_code
        and r.host_user_id = auth.uid()
    )
  );

create policy state_select_members on public.room_state
  for select
  using (
    exists (
      select 1
      from public.room_members m
      where m.room_code = room_state.room_code
        and m.user_id = auth.uid()
    )
  );

create policy actions_insert_members on public.client_actions
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.room_members m
      where m.room_code = client_actions.room_code
        and m.user_id = auth.uid()
    )
  );

create policy actions_select_host on public.client_actions
  for select
  using (
    exists (
      select 1
      from public.rooms r
      where r.code = client_actions.room_code
        and r.host_user_id = auth.uid()
    )
  );

create policy priv_insert_host on public.private_messages
  for insert
  with check (
    exists (
      select 1
      from public.rooms r
      where r.code = private_messages.room_code
        and r.host_user_id = auth.uid()
    )
  );

create policy priv_select_recipient on public.private_messages
  for select
  using (recipient_user_id = auth.uid());

