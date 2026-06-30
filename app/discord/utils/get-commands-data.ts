import { commands } from "../commands/index.ts";

/**
 * Get commands data in JSON format ready for deployment.
 * When guildId is provided, returns only global commands + commands scoped to that guild.
 */
export function getCommandsData(guildId?: string) {
  const commandsData = [];
  for (const command of commands) {
    if (!("data" in command && "execute" in command)) {
      console.log(`[WARNING] A command is missing a required "data" or "execute" property.`);
      continue;
    }
    if (command.guildId && command.guildId !== guildId) continue;
    try {
      commandsData.push(command.data.toJSON());
    } catch (error) {
      console.error(`Error preparing command:`, command, error);
    }
  }
  return commandsData;
}
