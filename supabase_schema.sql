-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,
  name text,
  age integer,
  bio text,
  photos text[] default '{}',
  langs text[] default '{}',
  interests text[] default '{}',
  social_energy text,
  drinks_pref text,
  smoking_pref text,
  music_genres text[] default '{}',
  transport text,
  format text,
  city text,
  color text default '#6366F1',
  created_at timestamptz default now()
);

-- Add auth_id if upgrading existing table
alter table profiles add column if not exists auth_id uuid unique;

-- ─── EVENTS ──────────────────────────────────────────────────────────────────
create table if not exists events (
  id bigserial primary key,
  host_id uuid references profiles(id) on delete cascade,
  title text not null,
  category text,
  date text,
  time text,
  location text,
  max_participants integer default 5,
  format text default 'group',
  description text,
  status text default 'open',
  created_at timestamptz default now()
);

-- ─── JOIN REQUESTS ────────────────────────────────────────────────────────────
create table if not exists join_requests (
  id bigserial primary key,
  event_id bigint references events(id) on delete cascade,
  requester_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(event_id, requester_id)
);

-- ─── CHATS ───────────────────────────────────────────────────────────────────
create table if not exists chats (
  id bigserial primary key,
  event_id bigint references events(id) on delete cascade,
  type text default 'group',
  last_msg text,
  created_at timestamptz default now()
);

create table if not exists chat_members (
  chat_id bigint references chats(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (chat_id, profile_id)
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
create table if not exists messages (
  id bigserial primary key,
  chat_id bigint references chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  text text not null,
  created_at timestamptz default now()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id bigserial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  type text,
  title text,
  body text,
  emoji text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ─── EVENT ATTENDEES (crew matching for official events) ─────────────────────
create table if not exists event_attendees (
  id bigserial primary key,
  event_ref_id bigint not null,
  event_title text,
  profile_id uuid references profiles(id) on delete cascade,
  group_size_min integer default 2,
  group_size_max integer default 5,
  transport text,
  status text default 'looking',
  created_at timestamptz default now(),
  unique(event_ref_id, profile_id)
);

-- ─── CREW INVITES ─────────────────────────────────────────────────────────────
create table if not exists crew_invites (
  id bigserial primary key,
  event_ref_id bigint not null,
  event_title text,
  inviter_id uuid references profiles(id) on delete cascade,
  invitee_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  chat_id bigint,
  created_at timestamptz default now(),
  unique(event_ref_id, inviter_id, invitee_id)
);

-- ─── BLOCKED USERS ──────────────────────────────────────────────────────────
create table if not exists blocked_users (
  blocker_id uuid references profiles(id) on delete cascade not null,
  blocked_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocked_users_blocker_idx on blocked_users(blocker_id);
create index if not exists blocked_users_blocked_idx on blocked_users(blocked_id);

-- ─── REPORTS ────────────────────────────────────────────────────────────────
create table if not exists reports (
  id bigserial primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  reported_id uuid references profiles(id) on delete cascade not null,
  reason text not null,
  details text,
  reviewed boolean default false,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  check (reporter_id <> reported_id),
  unique (reporter_id, reported_id, reason)
);
create index if not exists reports_reported_idx on reports(reported_id);
create index if not exists reports_unreviewed_idx on reports(created_at desc) where reviewed = false;

-- ─── ADMIN BAN COLUMN ───────────────────────────────────────────────────────
alter table profiles add column if not exists is_banned boolean default false;
create index if not exists profiles_is_banned_idx on profiles(is_banned) where is_banned = true;

-- ─── DISABLE RLS (for development) ───────────────────────────────────────────
alter table profiles disable row level security;
alter table events disable row level security;
alter table join_requests disable row level security;
alter table chats disable row level security;
alter table chat_members disable row level security;
alter table messages disable row level security;
alter table notifications disable row level security;
alter table event_attendees disable row level security;
alter table crew_invites disable row level security;
alter table blocked_users disable row level security;
alter table reports disable row level security;

-- ─── PROD RLS NOTE ──────────────────────────────────────────────────────────
-- Production policies on blocked_users / reports live only in the prod DB
-- and MUST use the profile-lookup pattern, not direct auth.uid() comparison
-- (which broke host_can_boost_own_event silently — June 2026 bug). If
-- re-creating from this schema, re-apply:
--   create policy "read own blocks" on blocked_users for select using (
--     blocker_id = (select id from profiles where auth_id = auth.uid())
--     or blocked_id = (select id from profiles where auth_id = auth.uid()));
--   create policy "user can block" on blocked_users for insert with check (
--     blocker_id = (select id from profiles where auth_id = auth.uid()));
--   create policy "user can unblock" on blocked_users for delete using (
--     blocker_id = (select id from profiles where auth_id = auth.uid()));
--   create policy "user can report" on reports for insert with check (
--     reporter_id = (select id from profiles where auth_id = auth.uid()));
-- Realtime publication must include both for client-side cleanup:
--   alter publication supabase_realtime add table blocked_users;
--   alter publication supabase_realtime add table reports;
