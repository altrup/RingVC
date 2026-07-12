-- Dev fixture only; production data is imported with scripts/import-data-txt.ts.
-- IDs are made-up snowflakes.

insert into users (user_id, mode)
values
	('100000000000000001', 'normal'),
	('100000000000000002', 'stealth');

insert into voice_chat_users (channel_id, user_id)
values
	('200000000000000001', '100000000000000001'),
	('200000000000000001', '100000000000000002');

insert into voice_chat_roles (channel_id, role_id)
values
	('200000000000000001', '300000000000000001');

-- user 1: global blacklist containing user 2
insert into filters (user_id, channel_id, is_whitelist)
values
	('100000000000000001', null, false);

insert into filter_entries (user_id, channel_id, target_user_id)
values
	('100000000000000001', null, '100000000000000002');

-- user 2: auto ring enabled in the seeded channel, ringing user 1 by default
insert into auto_ring (user_id, channel_id, enabled)
values
	('100000000000000002', '200000000000000001', true);

insert into default_ringees (user_id, channel_id, ringee_user_id)
values
	('100000000000000002', null, '100000000000000001');
