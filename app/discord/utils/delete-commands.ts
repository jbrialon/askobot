import { REST, Routes } from "discord.js";

/**
 * Delete all Discord application commands
 * Can be run independently with: node app/discord/utils/delete-commands.ts
 */
export async function deleteCommands() {
  const clientId = process.env["DISCORD_CLIENT_ID"] as string;
  const token = process.env["DISCORD_TOKEN"] as string;

  if (!clientId || !token) {
    throw new Error("Missing DISCORD_CLIENT_ID or DISCORD_TOKEN environment variables");
  }

  const rest = new REST().setToken(token);

  try {
    console.log("Starting to delete all application commands...");

    await rest.put(Routes.applicationCommands(clientId), { body: [] });

    console.log("Successfully deleted all application commands.");
  } catch (error) {
    console.error("Error deleting commands:", error);
    throw error;
  }
}

// If this script is run directly, execute deleteCommands
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteCommands()
    .then(() => {
      console.log("Delete completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Delete failed:", error);
      process.exit(1);
    });
}
