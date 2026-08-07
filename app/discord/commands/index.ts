import type { CommandHandler } from "./types.ts";
import { askobotCommand } from "./askobot.ts";
import { setPatchCommand } from "./setpatch.ts";
import { storageCommand } from "./storage.ts";
import { musicCommand } from "./music.ts";

export const commands: CommandHandler[] = [askobotCommand, setPatchCommand, storageCommand, musicCommand];
