import { ChatMessage } from "@twurple/chat";

export interface CommandHandler {
  name: string;
  aliases?: string[];
  cooldown?: number; // Cooldown in minutes, undefined means no cooldown
  execute: (channel: string, user: string, params: string[], msg: ChatMessage) => Promise<string>;
}
