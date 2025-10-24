import type { ChatMessage } from "@twurple/chat";

import askobot from "../../services/askobot.ts";
import type { CommandHandler, CommandResponse } from "./types.ts";

export class AskobotCommand implements CommandHandler {
  name = "askowbot";
  aliases = ["askobot"];
  excludedChannels = [];
  cooldown = 0;
  async execute(channel: string, user: string, params: string[], msg: ChatMessage): Promise<CommandResponse> {
    const message = params.join(" ");
    const displayName = msg.userInfo.displayName || user;

    return await askobot.generateResponse(channel, displayName, message);
  }
}

export const askobotCommand = new AskobotCommand();
