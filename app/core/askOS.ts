import OpenAI from "openai";
import { getChannelInfo } from "../utils/twitch-data.js";
import { jsonrepair } from "jsonrepair";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import config from "../../config.js";
import type { GenerateResponseParams, AskOSResponse, ContextVars } from "./types.ts";
import contextCore from "./cores/contextCore.ts";
import { createOutputSchema } from "./cores/responseCore.ts";
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

    // Get conversation history from MemoryCore
    const history = memoryCore.getHistory(params.channel);

    const contextVars = contextCore.buildContextVars(params, channelConfig, channelInfo);
    const input = this.buildInputMessages(params, contextVars, history);
    const outputSchema = createOutputSchema();

    const response = await this.callOpenAI(input, outputSchema, channelConfig.maxChar);

    // Store conversation in MemoryCore
    memoryCore.addConversation(params.channel, params.user, params.message, response.message, params.platform);

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

  /**
   * Converts character count to estimated token count.
   *
   * Rule of thumb: 1 token ≈ 3 characters for French text
   *
   * @param maxChar - Maximum character limit
   * @returns Estimated maximum tokens
   */
  private charsToTokens(maxChar: number): number {
    // French text: 1 token ≈ 3 characters
    // Using 3.2 to add a small safety buffer
    // adding 20 because we are outputting in json
    return Math.ceil(maxChar / 3.2) + 30;
  }

  private async callOpenAI(input: any[], outputSchema: z.ZodType, maxChar?: number): Promise<AskOSResponse> {
    const responseFormat = zodResponseFormat(outputSchema, "structured_output");
    const maxOutputTokens = maxChar ? this.charsToTokens(maxChar) : 300;

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
      max_output_tokens: maxOutputTokens,
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
