# Askobot 🤖

---

## 🧰 Project Structure

```
askobot/
├── app.js                # Express server and Socket.IO setup
├── front/                # Front-end (React) app
│   ├── src/app.jsx       # Main App component
│   └── ...
├── app/classes/          # Core logic (Voice, TwitchBot, etc.)
├── .env                  # API keys and secrets
├── package.json          # Scripts and dependencies
└── cron/                 # Task to update the bot "database"
```

---

## 📦 Installation

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
npm run serve
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

## 🧪 Development Tips

- Use the **Leva UI panel** to fake OBS scenes setup.

---

## 🧪 Testing EventSub with Twitch CLI

### Channel Point Redemption Testing

```bash
# Trigger a channel point redemption event
twitch event trigger channel.channel_points_custom_reward_redemption.add -F http://localhost:3000/eventsub -n "askobot" -s thesecret
```

### Other EventSub Events

```bash
# Follow event
twitch event trigger follow -F http://localhost:3000/eventsub -s thesecret

# Subscription event
twitch event trigger subscribe -F http://localhost:3000/eventsub -s thesecret

# Hype Train event
twitch event trigger hype-train-begin -F http://localhost:3000/eventsub -n "askobot" -s thesecret

# Raid event
twitch event trigger raid -F http://localhost:3000/eventsub -s thesecret
```
