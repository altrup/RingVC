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
- Have a Discord bot created ([guide](https://discordjs.guide/legacy/preparations/app-setup))
- Enable required permissions (for [auto mode](#mode))
	- Under settings, on the left side, select Bot
	- Scroll down to Privileged Gateway Intents
	- Enable Presence Intent

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
- To deploy commands, run

  ```bash
  npm run deploy-commands
  ```
- To start bot with hot reloading, run

  ```bash
  npm run dev
  ```