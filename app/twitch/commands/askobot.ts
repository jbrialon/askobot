import { ChatMessage } from "@twurple/chat";

import askobot from "../../services/askobot.js";
import { CommandHandler, CommandResponse } from "./types.js";

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
