import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { getCommandsData } from "./get-commands-data.ts";

/**
 * Deploy Discord commands to all guilds
 * Can be run independently with: node app/discord/utils/deploy-commands.ts
 */
export async function deployCommands() {
  const clientId = process.env["DISCORD_CLIENT_ID"] as string;
  const token = process.env["DISCORD_TOKEN"] as string;

  if (!clientId || !token) {
    throw new Error("Missing DISCORD_CLIENT_ID or DISCORD_TOKEN environment variables");
  }

  const rest = new REST().setToken(token);

  // Create a temporary client to access guilds
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  try {
    console.log(`Started refreshing application (/) commands across all guilds.`);

    // Wait for client to be ready
    await new Promise<void>((resolve) => {
      client.once(Events.ClientReady, () => resolve());
      client.login(token);
    });

    console.log(`Askobot is in ${client.guilds.cache.size} guilds`);

    // Deploy to each guild
    let deployedCount = 0;
    for (const guild of client.guilds.cache.values()) {
      try {
        const guildCommands = getCommandsData(guild.id);
        await rest.put(Routes.applicationGuildCommands(clientId, guild.id), {
          body: guildCommands,
        });
        console.log(`Deployed ${guildCommands.length} commands to ${guild.name} (${guild.id})`);
        deployedCount++;
      } catch (error) {
        console.error(`Failed to deploy to ${guild.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`Successfully deployed commands to ${deployedCount}/${client.guilds.cache.size} guilds.`);
  } catch (error) {
    console.error("Error deploying commands:", error);
    throw error;
  } finally {
    await client.destroy();
  }
}

// If this script is run directly, execute deployCommands
if (import.meta.url === `file://${process.argv[1]}`) {
  await import("dotenv/config");
  deployCommands()
    .then(() => {
      console.log("Deploy completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Deploy failed:", error);
      process.exit(1);
    });
}
