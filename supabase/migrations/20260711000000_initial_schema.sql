-- Initial schema. All Discord IDs (snowflakes) are stored as text.
-- Per-user settings tables use a nullable channel_id, where NULL means the
-- setting applies globally. Absence of a row means the default (blacklist
-- filter, empty lists, auto ring off), so defaults are never stored.

create type discord_user_mode as enum ('normal', 'stealth', 'auto');

create table users (
	user_id text primary key,
	mode discord_user_mode not null default 'normal'
);

-- users signed up to be pinged when a call starts in a channel
create table voice_chat_users (
	channel_id text not null,
	user_id text not null,
	primary key (channel_id, user_id)
);
-- used by /delete_data to remove a user's signups across channels
create index voice_chat_users_user_id_idx on voice_chat_users (user_id);

-- roles signed up to be pinged when a call starts in a channel
create table voice_chat_roles (
	channel_id text not null,
	role_id text not null,
	primary key (channel_id, role_id)
);

-- whether a user's filter is a whitelist or a blacklist (per channel or global)
create table filters (
	user_id text not null references users (user_id) on delete cascade,
	channel_id text,
	is_whitelist boolean not null,
	unique nulls not distinct (user_id, channel_id)
);

-- the members of a user's filter list
create table filter_entries (
	user_id text not null references users (user_id) on delete cascade,
	channel_id text,
	target_user_id text not null,
	unique nulls not distinct (user_id, channel_id, target_user_id)
);

-- whether joining a channel automatically rings the user's default ringees
create table auto_ring (
	user_id text not null references users (user_id) on delete cascade,
	channel_id text,
	enabled boolean not null,
	unique nulls not distinct (user_id, channel_id)
);

-- who gets rung by /ring default and auto ring
create table default_ringees (
	user_id text not null references users (user_id) on delete cascade,
	channel_id text,
	ringee_user_id text not null,
	unique nulls not distinct (user_id, channel_id, ringee_user_id)
);

-- The bot connects with the service role; grant it data access explicitly
-- instead of relying on the stack's default privileges. anon/authenticated
-- get nothing.
grant select, insert, update, delete
	on all tables in schema public
	to service_role;

-- The bot connects with the service role, which bypasses RLS. Enabling RLS
-- with no policies locks out anon/authenticated access through PostgREST.
alter table users enable row level security;
alter table voice_chat_users enable row level security;
alter table voice_chat_roles enable row level security;
alter table filters enable row level security;
alter table filter_entries enable row level security;
alter table auto_ring enable row level security;
alter table default_ringees enable row level security;
