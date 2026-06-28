import type { CommandHandler } from "./types.ts";
import { askobotCommand } from "./askobot.ts";
import { setPatchCommand } from "./setpatch.ts";

export const commands: CommandHandler[] = [askobotCommand, setPatchCommand];
