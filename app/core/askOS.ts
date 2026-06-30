import { Mistral } from "@mistralai/mistralai";
import { getChannelData } from "../twitch/channel-data.ts";
import { jsonrepair } from "jsonrepair";
import { z } from "zod";

import config from "../../config.js";
import type { GenerateResponseParams, AskOSResponse, ContextVars, reactToEventParams } from "./types.ts";
import contextCore from "./cores/contextCore.ts";
import responseCore from "./cores/responseCore.ts";
import memoryCore from "./cores/memoryCore.ts";
import { IntentCore } from "./cores/intentCore.ts";
import { logInteraction } from "../database/index.ts";

/**
 * AskOS v0.2alpha
 *
 * The central AI operating system for Askobot. Coordinates all personality cores
 * and manages conversation generation through Mistral AI integration.
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
  private mistral: Mistral;
  private model: string;
  private intentCore: IntentCore;

  constructor() {
    this.model = "mistral-medium-latest";
    this.mistral = new Mistral({
      apiKey: process.env["MISTRAL_API_KEY"],
    });
    this.intentCore = new IntentCore(this.mistral);
  }

  async generateResponse(params: GenerateResponseParams): Promise<AskOSResponse> {
    const channelConfig = this.getChannelConfig(params.channel);

    const platform = params.platform || "twitch";

    // Get conversation history before classification so IntentCore can resolve references
    const history = memoryCore.getHistory(params.channel);

    const [channelData, intent] = await Promise.all([getChannelData(params.channel), this.intentCore.classify(params.message, history)]);

    if (!channelData) {
      throw Error("[AskOS.generateResponse] could not get ChannelData ");
    }

    const contextVars = await contextCore.buildContextVars(
      { type: "chat", user: params.user, message: params.message, platform },
      channelConfig,
      channelData,
      intent,
    );

    const input = this.buildInputMessages(params, contextVars, history);
    const outputSchema = responseCore.createOutputSchema();
    const response = await this.callMistral(input, outputSchema);

    // Store conversation in MemoryCore
    memoryCore.addConversation(params.channel, params.user, params.message, response.message, params.platform);

    logInteraction({
      type: "chat",
      platform,
      channel: params.channel,
      message: params.message,
      intent,
      response,
    });

    return response;
  }

  async reactToEvent(params: reactToEventParams): Promise<AskOSResponse> {
    const channelConfig = this.getChannelConfig(params.channel);
    const channelData = await getChannelData(params.channel);

    if (!channelData) {
      throw Error("[AskOS.reactToEvent] could not get ChannelData ");
    }

    const platform = params.platform || "twitch";

    const contextVars = await contextCore.buildContextVars(
      { type: "event", eventType: params.eventType, eventData: params.eventData, platform },
      channelConfig,
      channelData,
    );

    const input = this.buildEventInputMessages(contextVars);
    const outputSchema = responseCore.createOutputSchema();

    const response = await this.callMistral(input, outputSchema);

    logInteraction({
      type: "event",
      platform,
      channel: params.channel,
      eventType: params.eventType,
      eventData: params.eventData,
      response,
    });

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

  private async callMistral(input: any[], outputSchema: z.ZodType): Promise<AskOSResponse> {
    try {
      const response = await this.mistral.chat.parse({
        model: this.model,
        messages: input,
        responseFormat: outputSchema,
        temperature: 0.7,
      });

      const parsed = response.choices?.[0]?.message?.parsed;
      if (parsed) {
        return parsed as AskOSResponse;
      }

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("No content in API response");
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
