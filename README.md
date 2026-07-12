# RingVC

A discord bot that tries to replicate Group Chat behavior in server Voice Channels

- Servers can't ring people, like in Group Chats, so bot just pings people in the Voice Channel Text Chats instead

## Usage

To add the bot to your server, click [here](https://discord.com/oauth2/authorize?client_id=885686322973536267)

### Commands

- **/help**
  - A quick description of all the commands
- **/signup**
  - signs you up for a voice channel, so once someone "starts" a call there (joins it when it's empty), you get pinged
- **/unsignup**
  - un-signs you up for a voice channel, so you no longer get pinged
- **/ring**
  - pings someone to join the voice channel you're currently in
- **/block**
  - blocks someone, which prevents them from ringing you and makes it so you don't get pinged if they start a call
- **/unblock**
  - unblocks someone
    <a name="mode"></a>
- **/mode**
  - allows you to switch between auto, normal, and stealth modes
    - stealth means that you don't ping anyone when "starting" a call

## Self-Hosting

Guide on hosting the bot yourself

### Prerequisites

- Docker Compose ([installation guide](https://docs.docker.com/compose/install/))
- Supabase CLI ([installation guide](https://supabase.com/docs/guides/local-development/cli/getting-started))
- Have a Discord bot created ([guide](https://discordjs.guide/legacy/preparations/app-setup))
- Enable required permissions (for [auto mode](#mode))
  - Under settings, on the left side, select Bot
  - Scroll down to Privileged Gateway Intents
  - Enable Presence Intent

### Self-hosting Supabase

The bot stores its data in a [Supabase](https://supabase.com) Postgres database, which you can self-host with Supabase's official Docker setup ([guide](https://supabase.com/docs/guides/self-hosting/docker)). A convenient place for it is a `supabase-docker/` folder in this repository (it is gitignored)

- Apply this repository's database migrations to your instance

  ```bash
  supabase db push --db-url <your_postgres_connection_string>
  ```

- Use the instance's API URL and service role key (from your Supabase Docker `.env`) as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` below
  - Note: the bot runs in its own container, so `SUPABASE_URL` must be reachable from inside it (use the host's address or a shared Docker network, not `127.0.0.1`)

### Migrating from data.txt

Older versions of the bot stored data in `data/data.txt`. To import it into your Supabase database, run

```bash
npx tsx scripts/import-data-txt.ts
```

with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set (in the environment or `.env`). The script is idempotent, so it is safe to re-run

### Installation & Usage

- Clone repository

  ```bash
  git clone https://github.com/altrup/RingVC.git
  ```

- Enter newly created folder

  ```bash
  cd RingVC
  ```

- Copy [`.env.example`](.env.example) to `.env` in root directory and replace the values
  ```bash
  cp .env.example .env
  ```
- Start bot in Docker

  ```bash
  docker compose up -d
  ```

- Invite bot to your server ([guide](https://discordjs.guide/legacy/preparations/adding-your-app))
  - Select `bot`, `applications.commands` and `Send Messages` permissions
- To stop, run

  ```bash
  docker compose down
  ```

- To update, run

  ```bash
  docker compose build
  ```

### Development

- For development, it may be easier to use `npm` directly instead of docker
- Start a local Supabase stack (uses Docker; applies migrations and [`supabase/seed.sql`](supabase/seed.sql) automatically)

  ```bash
  supabase start
  ```

  and point `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in `.env` at the values it prints

- To re-apply migrations and seed data from scratch, run

  ```bash
  supabase db reset
  ```

- After changing the schema (adding a migration), regenerate the database types

  ```bash
  supabase gen types typescript --local > src/main/db/database.types.ts
  ```

- To deploy commands, run

  ```bash
  npm run deploy-commands
  ```

- To start bot with hot reloading, run

  ```bash
  npm run dev
  ```
