import "dotenv/config";
import { dbPool } from "./index.ts";

if (!process.env["SYM_ENCRYPTION_KEY"]) {
  throw Error("env variable SYM_ENCRYPTION_KEY must be set");
}

const pgp_sym_encrypt = process.env["SYM_ENCRYPTION_KEY"];

export class oAuthTokensPersistentStorage {
  static async hasTokens(userId: string): Promise<boolean | null> {
    try {
      const { rows } = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM user_tokens WHERE ID = $1);`, [userId]);
      return rows[0].exists;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  static async getTokens(userId: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
    try {
      const { rows } = await dbPool.query(
        `
        SELECT PGP_SYM_DECRYPT(access_token, $2) as access_token, PGP_SYM_DECRYPT(refresh_token, $2) as refresh_token, expires_in FROM user_tokens WHERE id = $1;
        `,
        [userId, pgp_sym_encrypt],
      );
      return rows[0];
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  static async setTokens(
    userId: string,
    { access_token, refresh_token, expires_in }: { access_token: string; refresh_token: string; expires_in: number },
  ) {
    try {
      await dbPool.query(
        `
        INSERT INTO user_tokens (id, access_token, refresh_token, expires_in) VALUES ($1, PGP_SYM_ENCRYPT($2, $5), PGP_SYM_ENCRYPT($3, $5), $4)
        ON CONFLICT (id) DO UPDATE SET access_token = PGP_SYM_ENCRYPT($2, $5), refresh_token = PGP_SYM_ENCRYPT($3, $5), expires_in = $4;
        `,
        [userId, access_token, refresh_token, expires_in, pgp_sym_encrypt],
      );
    } catch (err) {
      console.error(err);
    }
  }
}
