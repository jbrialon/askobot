import { commands } from "../commands/index.ts";

/**
 * Get commands data in JSON format ready for deployment
 * Used by deploy-commands and when the bot joins a new guild
 */
export function getCommandsData() {
  const commandsData = [];
  for (const command of commands) {
    if ("data" in command && "execute" in command) {
      try {
        commandsData.push(command.data.toJSON());
      } catch (error) {
        console.error(`Error preparing command:`, command, error);
      }
    } else {
      console.log(`[WARNING] A command is missing a required "data" or "execute" property.`);
    }
  }
  return commandsData;
}
