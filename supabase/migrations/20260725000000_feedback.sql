-- Feedback submitted through the About panel's feedback form. Anonymous by
-- design: only the text and a timestamp, never the submitter's identity.
create table feedback (
	id bigint generated always as identity primary key,
	content text not null,
	created_at timestamptz not null default now()
);

grant select, insert, update, delete on feedback to service_role;

alter table feedback enable row level security;
