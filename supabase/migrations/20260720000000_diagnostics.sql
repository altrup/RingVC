-- Anonymous diagnostics. `interaction` is a feature key, never user data:
-- a command name ("COMMAND /ring") or a registered route pattern
-- ("POST /ring/user") — route params stay as ":name" placeholders.

-- aggregate usage: one counter per feature per day
create table usage_counts (
	interaction text not null,
	day date not null default current_date,
	count bigint not null default 0,
	primary key (interaction, day)
);

-- `error` is the error's type, code, and stack frames — never the free-text
-- message, which can embed IDs and server/channel names
create table error_reports (
	id bigint generated always as identity primary key,
	interaction text not null,
	error text not null,
	created_at timestamptz not null default now()
);

-- atomic increment; supabase-js upserts can't express count = count + 1
create function record_usage(p_interaction text) returns void
language sql as $$
	insert into usage_counts (interaction, count)
	values (p_interaction, 1)
	on conflict (interaction, day)
	do update set count = usage_counts.count + 1;
$$;

grant select, insert, update, delete
	on usage_counts, error_reports
	to service_role;
grant execute on function record_usage to service_role;

alter table usage_counts enable row level security;
alter table error_reports enable row level security;
