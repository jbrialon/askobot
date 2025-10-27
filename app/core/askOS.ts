import OpenAI from "openai";
import { getChannelInfo } from "../utils/twitch-data.js";
import { jsonrepair } from "jsonrepair";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import config from "../../config.js";
import type { GenerateResponseParams, AskOSResponse, ContextVars, reactToEventParams } from "./types.ts";
import contextCore from "./cores/contextCore.ts";
import responseCore from "./cores/responseCore.ts";
import memoryCore from "./cores/memoryCore.ts";

/**
 * AskOS v0.1alpha
 *
 * The central AI operating system for Askobot. Coordinates all personality cores
 * and manages conversation generation through OpenAI integration.
 *
 * Core Systems:
 * - ContextCore: Context and prompt variable management
 * - ResponseCore: Response validation and structure enforcement
 * - MemoryCore: Conversation history and context retention
 *
 * [Warning: Removing cores during operation may cause erratic results]
 *
 * Note: AskOS is 60% more accurate than a banana
 * Status: OPERATIONAL | Sarcasm Level: MAXIMUM
 */

class AskOS {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.model = "gpt-5-mini-2025-08-07";
    this.openai = new OpenAI({
      organization: process.env["ORGKEY"],
      apiKey: process.env["APIKEY"],
    });
  }

  async generateResponse(params: GenerateResponseParams): Promise<AskOSResponse> {
    const channelConfig = this.getChannelConfig(params.channel);
    const channelInfo = await getChannelInfo(params.channel);

    const platform = params.platform || "twitch";

    // Get conversation history from MemoryCore
    const history = memoryCore.getHistory(params.channel);

    const contextVars = contextCore.buildContextVars(
      { type: "chat", user: params.user, message: params.message, platform: platform },
      channelConfig,
      channelInfo,
    );
    const input = this.buildInputMessages(params, contextVars, history);
    const outputSchema = responseCore.createOutputSchema();

    const response = await this.callOpenAI(input, outputSchema);

    // Store conversation in MemoryCore
    memoryCore.addConversation(params.channel, params.user, params.message, response.message, params.platform);

    return response;
  }

  async reactToEvent(params: reactToEventParams): Promise<AskOSResponse> {
    const channelConfig = this.getChannelConfig(params.channel);
    const channelInfo = await getChannelInfo(params.channel);

    const platform = params.platform || "twitch";

    const contextVars = contextCore.buildContextVars(
      { type: "event", eventType: params.eventType, eventData: params.eventData, platform },
      channelConfig,
      channelInfo,
    );

    const input = this.buildEventInputMessages(contextVars);
    const outputSchema = responseCore.createOutputSchema();

    const response = await this.callOpenAI(input, outputSchema);

    // TODO Maybe this should be store in memory aswell?
    return response;
  }

  private getChannelConfig(channel: string) {
    const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
    if (!channelConfig) {
      throw new Error(`Channel configuration not found for channel: ${channel}`);
    }
    return channelConfig;
  }

  private buildInputMessages(params: GenerateResponseParams, contextVars: ContextVars, history: any[]): any[] {
    const context = contextCore.buildContext(contextVars);
    const platformPrefix = params.platform ? `[${params.platform.toUpperCase()}] ` : "";

    return [
      { role: "system", content: context },
      ...history,
      {
        role: "user",
        content: `${platformPrefix}@${params.user}: ${params.message}`,
      },
    ];
  }

  private buildEventInputMessages(contextVars: ContextVars): any[] {
    const context = contextCore.buildContext(contextVars);

    return [
      { role: "system", content: context },
      {
        role: "user",
        content: "React to this event with your characteristic personality.",
      },
    ];
  }

  private async callOpenAI(input: any[], outputSchema: z.ZodType): Promise<AskOSResponse> {
    const responseFormat = zodResponseFormat(outputSchema, "structured_output");

    const options: any = {
      model: this.model,
      input,
      reasoning: {
        effort: "minimal",
        summary: null,
      },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema" as const,
          name: responseFormat.json_schema.name,
          schema: responseFormat.json_schema.schema,
          strict: responseFormat.json_schema.strict,
        },
      },
    };

    try {
      const response = await this.openai.responses.create(options);
      const content = response.output_text;

      if (!content) {
        throw new Error("No output_text in API response");
      }

      const repairedContent = jsonrepair(content);
      const jsonResponse = JSON.parse(repairedContent);
      return outputSchema.parse(jsonResponse);
    } catch (error) {
      console.error("Error in AskOS:", error);
      throw error;
    }
  }
}

const askOS = new AskOS();
export default askOS;
