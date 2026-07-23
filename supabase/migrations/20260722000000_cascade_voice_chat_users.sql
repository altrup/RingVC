-- Signups are user data like the settings tables, so cascade them from
-- users: /delete_data then wipes everything with one users delete.

-- signups could exist without a users row; create the missing parents
insert into users (user_id)
	select distinct user_id from voice_chat_users
	on conflict do nothing;

alter table voice_chat_users
	add constraint voice_chat_users_user_id_fkey
	foreign key (user_id) references users (user_id) on delete cascade;
