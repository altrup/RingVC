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
- Have a Discord bot created ([guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))
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
- Create `config.json` in root directory with the following values:
  ```JSON
  {
    "token": "Your custom Discord bot token",
    "clientId": "Your custom Discord bot's client ID"

    "saveCooldown": "How often new data should be saved, in seconds"
  }
  ```
  - Example (with an invalid token; you'll need your own):
    
    ```JSON
    {
      "token": "MTE4MjM0NTY3ODkwMTIzNDU2.Gh7Kj9.dQw4w9WgXcQ_WxYz1234567890AbCdEfGhIjKlM",
      "clientId": "963163591003628162"

      "saveCooldown": "60"
    }
    ```
- Start bot in Docker

  ```bash
  docker compose up -d
  ```
- Invite bot to your server ([guide](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#creating-and-using-your-invite-link))
  - Select `bot`, `applications.commands` and `Send Messages` permissions
- To stop, run

  ```bash
  docker compose down
  ```
- To update, run

  ```bash
  docker compose build
  ```