import { Router } from "express";
import { dbPool } from "./index.ts";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { channel, type, platform, intent, from, to, limit = "50", offset = "0" } = req.query;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (channel) {
      conditions.push(`channel = $${paramIndex++}`);
      values.push(channel);
    }
    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (platform) {
      conditions.push(`platform = $${paramIndex++}`);
      values.push(platform);
    }
    if (intent) {
      conditions.push(`intent->>'intent' = $${paramIndex++}`);
      values.push(intent);
    }
    if (from) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(from);
    }
    if (to) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 200);
    const offsetNum = Math.max(parseInt(offset as string, 10) || 0, 0);

    const { rows } = await dbPool.query(
      `SELECT * FROM interactions ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limitNum, offsetNum],
    );

    res.json(rows);
  } catch (error) {
    console.error("[API] Failed to fetch interactions:", error);
    res.status(500).json({ error: "Failed to fetch interactions" });
  }
});

export default router;
