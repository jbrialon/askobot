# Discord Command Management Utilities

Standalone utilities for managing Discord slash commands.

## Utilities

- **get-commands-data.ts** - Shared utility to prepare commands data for deployment
- **deploy-commands.ts** - Deploy commands to all guilds
- **delete-commands.ts** - Delete all application commands

## Deploy Commands

Deploy all Discord slash commands to all guilds the bot is in:

```bash
node app/discord/utils/deploy-commands.ts
```

This will:

- Connect to Discord with your bot credentials
- Fetch all guilds the bot is in
- Deploy commands to each guild
- Show progress and success/failure for each guild

## Delete Commands

Delete all Discord application commands:

```bash
node app/discord/utils/delete-commands.ts
```

This will remove all global application commands from Discord.

## Environment Variables Required

Both scripts require these environment variables (defined in `.env`):

- `DISCORD_CLIENT_ID` - Your Discord application client ID
- `DISCORD_TOKEN` - Your Discord bot token
