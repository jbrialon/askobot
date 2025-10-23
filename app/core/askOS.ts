import OpenAI from "openai";
import { getChannelInfo } from "../utils/twitch-data.js";
import { jsonrepair } from "jsonrepair";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import config from "../../config.js";
import type { GenerateResponseParams, AskOSResponse } from "./types.js";
import { buildContext, buildPromptVars } from "./cores/contextCore.js";
import { createOutputSchema } from "./cores/schemaCore.js";

/**
 * AskOS v0.1alpha
 *
 * The central AI operating system for Askobot. Coordinates all personality cores
 * and manages conversation generation through OpenAI integration.
 *
 * Core Systems:
 * - ContextCore: Context and prompt variable management
 * - SchemaCore: Response validation and structure enforcement
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
    this.model = "gpt-4o-mini-2024-07-18";
    this.openai = new OpenAI({
      organization: process.env["ORGKEY"],
      apiKey: process.env["APIKEY"],
    });
  }

  async generateResponse(params: GenerateResponseParams): Promise<AskOSResponse> {
    const channelConfig = this.getChannelConfig(params.channel);
    const channelInfo = await getChannelInfo(params.channel);
    const promptVars = buildPromptVars(params, channelConfig, channelInfo);
    const input = this.buildInputMessages(params, promptVars);
    const outputSchema = createOutputSchema(channelConfig);

    return await this.callOpenAI(input, outputSchema);
  }

  private getChannelConfig(channel: string) {
    const channelConfig = config.channels.find((c) => c.twitchChannel === channel);
    if (!channelConfig) {
      throw new Error(`Channel configuration not found for channel: ${channel}`);
    }
    return channelConfig;
  }

  private buildInputMessages(params: GenerateResponseParams, promptVars: Record<string, any>): any[] {
    const context = buildContext(promptVars);
    const platformPrefix = params.platform ? `[${params.platform.toUpperCase()}] ` : "";

    return [
      { role: "system", content: context },
      ...(params.history || []),
      {
        role: "user",
        content: `${platformPrefix}@${params.user}: ${params.message}`,
      },
    ];
  }

  private async callOpenAI(input: any[], outputSchema: z.ZodType): Promise<AskOSResponse> {
    const responseFormat = zodResponseFormat(outputSchema, "structured_output");
    const options: any = {
      model: this.model,
      input,
      text: {
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
