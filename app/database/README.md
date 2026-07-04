# Interactions API

## `GET /api/interactions`

Returns logged bot interactions (chat messages and events).

## Query Parameters

| Parameter  | Description                             | Example              |
| ---------- | --------------------------------------- | -------------------- |
| `channel`  | Filter by Twitch channel                | `askow`              |
| `type`     | `chat` or `event`                       | `chat`               |
| `platform` | `twitch` or `discord`                   | `twitch`             |
| `intent`   | Filter by intent category               | `question`, `banter` |
| `from`     | Start date (inclusive)                  | `2026-07-01`         |
| `to`       | End date (inclusive)                    | `2026-07-31`         |
| `limit`    | Number of results (default 50, max 200) | `10`                 |
| `offset`   | Pagination offset (default 0)           | `50`                 |

## Intent Categories

`question`, `opinion`, `command_help`, `banter`, `react`, `system`, `other`

## Examples

```
GET /api/interactions
GET /api/interactions?channel=askow&limit=10
GET /api/interactions?intent=question&from=2026-07-01
GET /api/interactions?type=event&platform=discord
GET /api/interactions?channel=askow&from=2026-07-01&to=2026-07-31&limit=100
```

## Response

Returns a JSON array of interaction objects:

```json
[
  {
    "id": 1,
    "created_at": "2026-07-04T14:30:00.000Z",
    "type": "chat",
    "platform": "twitch",
    "channel": "askow",
    "message": "c'est quoi le pouvoir de Milificent?",
    "event_type": null,
    "event_data": null,
    "intent": {
      "intent": "question",
      "needsCommands": false,
      "needsGameData": true,
      "gameQuery": "Milificent",
      "needsPatchNotes": false
    },
    "response": {
      "message": "Découvre un Méca avec Magnétisme. Niveau 4, bien sûr !",
      "emotion": "excited",
      "animation": "spin"
    }
  }
]
```
