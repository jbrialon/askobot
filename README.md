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

## 🛠️ Future Ideas / TODO

- Start Scene
- End Scene with credits
- Scene when playing, askobot appears only when he speaks, from above? randomly on the screen?
- actual scene for both start and end

---
