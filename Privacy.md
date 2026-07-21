# RingVC Privacy Policy

- Only data necessary for the functioning of the bot is collected and/or stored
- Data is never shared and only used for the functioning and development of the bot
- See the database schema in [`supabase/migrations`](/supabase/migrations) for exactly what is stored

## Stored Data

- User IDs of users who use block or filter commands to set up a filter of who can ring them, and the User IDs of the people that they block
- Voice Channel IDs and User IDs when a user is signed up for a Voice Channel

## Temporary Data

- Status (online, offline) of users who are using `/mode set auto`

## Diagnostic Data

- Error reports (the command or interaction that failed, the type of error and where in the code it occurred, and a timestamp) are collected to fix bugs
- Anonymous aggregate usage counts of commands and embed interactions are collected
- Diagnostic data never includes User IDs, server or channel names, command arguments, or error message text

## Deleting Data

- Stored Data will never be deleted automatically
- Run `/delete_data` to delete all of your data
