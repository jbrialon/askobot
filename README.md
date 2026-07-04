# Askobot 🤖

---

## Project Structure

```
askobot/
├── app.js                # Express server and Socket.IO setup
├── config.js             # Bot configuration (channels, personality, community)
├── front/                # Frontend React app with Three.js visualization
│   ├── src/app.jsx       # Main App component
│   └── ...
├── app/
│   ├── classes/          # Core services (Socket, Voice, MemoryCache)
│   ├── core/             # AskOS - Modular AI brain system
│   │   ├── askOS.ts      # Main AI coordinator (singleton)
│   │   ├── cores/        # Personality cores (Context, Knowledge, Schema, Memory)
│   │   ├── tapes/        # Data structures for core communication
│   │   └── types.ts      # TypeScript interfaces
│   ├── twitch/           # Twitch integration
│   │   ├── chat-bot.ts   # Modern @twurple-based bot
│   │   ├── commands/     # Hearthstone BG commands
│   │   └── events/       # EventSub handlers
│   ├── database/         # PostgreSQL integration
│   ├── discord/          # Discord webhook notifications
│   ├── utils/            # Helper utilities (battleground data, fuzzy matching)
│   └── tests/            # Test suites
├── cron/                 # Scheduled tasks (card data updates)
├── .env                  # API keys and secrets
└── package.json          # Scripts and dependencies
```

---

## Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Create a `.env` file at the root with your API keys.
   - Create a `db.json` in the `db/` folder containing just `[]` inside.

### Databse Setup

1. Create local_db and if you do not have one already, create a superuser role for your local user

```shell
createdb local_db
sudo -u postgres psql
```

In psql create superuser role for your local user (replace %USERNAME% by your local unix user):

```sql
CREATE ROLE %USERNAME% SUPERUSER LOGIN;
```

2. Connect to local_db and create local_user

```shell
psql -U %USERNAME% -d local_db
```

In psql:

```sql
CREATE USER local_user WITH PASSWORD 'local_password';
GRANT CREATE ON SCHEMA public TO local_user;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

## 🔧 Usage

### 1. Start the backend (chatbot + server)

```bash
npm run dev
```

This launches the Express server, connects the Twitch bot and sets up Socket.IO.

### 2. Start the front-end (React app)

In a second terminal:

```bash
cd front
npm install
npm run dev     # For development (Vite)
```

To build for production:

```bash
npm run build
```

The built front-end will be served statically by the backend.

---

## Development Tips

- Use the **Leva UI panel** to fake OBS scenes setup.

---

## Testing EventSub with Twitch CLI

### EventSub Events

```bash
# Follow event
twitch event trigger follow -F http://localhost:3000/eventsub -s $TWITCH_EVENTSUB_SECRET

# Subscription event
twitch event trigger subscribe -F http://localhost:3000/eventsub -s $TWITCH_EVENTSUB_SECRET

# Hype Train event
twitch event trigger hype-train-begin -F http://localhost:3000/eventsub -n "askobot" -s $TWITCH_EVENTSUB_SECRET

# Raid event
twitch event trigger raid -F http://localhost:3000/eventsub -s $TWITCH_EVENTSUB_SECRET

# Stream online
twitch event trigger stream.online -F http://localhost:3000/eventsub -s $TWITCH_EVENTSUB_SECRET

# Channel updae
twitch event trigger channel.update -F http://localhost:3000/eventsub --version 2 -s $TWITCH_EVENTSUB_SECRET

# Trigger a channel point redemption event for reward "askobot"
twitch event trigger channel.channel_points_custom_reward_redemption.add -F http://localhost:3000/eventsub -n "askobot" -s $TWITCH_EVENTSUB_SECRET
```
