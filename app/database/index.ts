import { Pool } from "pg";
import type { IntentClassification, AskOSResponse } from "../core/types.ts";

export const dbPool = new Pool();

export async function setupDatabase() {
  await dbPool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL NOT NULL PRIMARY KEY,
    access_token BYTEA NOT NULL,
    refresh_token BYTEA NOT NULL,
    expires_in INTEGER NOT NULL);
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    type VARCHAR(10),
    platform VARCHAR(10),
    channel VARCHAR(255),
    message TEXT,
    event_type VARCHAR(100),
    event_data TEXT,
    intent JSONB,
    response JSONB);
  `);

  console.log("[Database] Setup complete");
}

interface LogInteractionParams {
  type: "chat" | "event";
  platform: "twitch" | "discord";
  channel: string;
  message?: string;
  eventType?: string;
  eventData?: string;
  intent?: IntentClassification;
  response: AskOSResponse;
}

export function logInteraction(params: LogInteractionParams): void {
  dbPool
    .query(
      `INSERT INTO interactions (type, platform, channel, message, event_type, event_data, intent, response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.type,
        params.platform,
        params.channel,
        params.message ?? null,
        params.eventType ?? null,
        params.eventData ?? null,
        params.intent ? JSON.stringify(params.intent) : null,
        JSON.stringify(params.response),
      ],
    )
    .catch((error) => console.error("[Database] Failed to log interaction:", error));
}

export async function getAuthenticatedUserIds(): Promise<string[]> {
  try {
    const { rows } = await dbPool.query("SELECT id FROM user_tokens");
    return rows.map((row: any) => row.id);
  } catch (error) {
    console.error("Failed to get authenticated user IDs:", error);
    return [];
  }
}
