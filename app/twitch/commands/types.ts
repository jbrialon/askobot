import { ChatMessage } from "@twurple/chat";

export interface CommandResponse {
  message: string;
  emotion?: string;
  animation?: string;
}

export interface CommandHandler {
  name: string;
  aliases?: string[];
  cooldown?: number; // Cooldown in minutes, undefined means no cooldown
  excludedChannels?: string[]; // Array of channels where the command will be disabled
  execute: (channel: string, user: string, params: string[], msg: ChatMessage) => Promise<CommandResponse>;
}
