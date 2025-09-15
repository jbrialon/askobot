import { Pool } from "pg";

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

  console.log("Database setup complete");
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
