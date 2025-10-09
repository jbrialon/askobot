import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import { zodResponseFormat } from "openai/helpers/zod";
import config from "../../config.js";

const createOpenAI = () => {
  const openai = new OpenAI({
    organization: process.env.ORGKEY,
    apiKey: process.env.APIKEY,
  });

  return async function aiFunction({ model = "gpt-4.1-nano", prompt, promptVars = {}, history = [], tools = [], outputSchema }) {
    const zodSchema = outputSchema || null;
    promptVars.prompt = prompt;

    const context = config.genericContext.replace(/\$\{(\w+)\}/g, (match, key) =>
      promptVars.hasOwnProperty(key) ? promptVars[key] : match,
    );

    const platformPrefix = promptVars.platform ? `[${promptVars.platform.toUpperCase()}] ` : "";
    const input = [
      ...(context ? [{ role: "system", content: context }] : []),
      ...history,
      {
        role: "user",
        content: promptVars.username ? `${platformPrefix}@${promptVars.username}: ${promptVars.message}` : promptVars.message,
      },
    ];
    const responseFormat = zodSchema ? zodResponseFormat(zodSchema, "structured_output") : null;
    const options = {
      model,
      input,
      tools: tools.length > 0 ? tools : undefined, // TODO
      ...(responseFormat && {
        text: {
          format: {
            type: "json_schema",
            name: responseFormat.json_schema.name,
            schema: responseFormat.json_schema.schema,
            strict: responseFormat.json_schema.strict,
          },
        },
      }),
    };
    try {
      const response = await openai.responses.create(options);
      const content = response.output_text;

      if (!content) {
        throw new Error("No output_text in API response");
      }

      const repairedContent = jsonrepair(content);
      const jsonResponse = JSON.parse(repairedContent);
      return zodSchema ? zodSchema.parse(jsonResponse) : jsonResponse;
    } catch (error) {
      throw error;
    }
  };
};

const buildPromptVars = ({ user, message, channelConfig, channelInfo, platform }) => {
  const randomMood = channelConfig.mood[Math.floor(Math.random() * channelConfig.mood.length)];
  const randomContext = channelConfig.context[Math.floor(Math.random() * channelConfig.context.length)];

  // Only include Twitch info when platform is twitch
  const platformInfo =
    platform === "twitch"
      ? `- The Title of the Twitch Channel is "${channelInfo.title}", its Category is "${channelInfo.game}" and the description of the channel is "${channelInfo.description}".`
      : "";

  // Platform-specific commands
  const availableCommands =
    platform === "twitch"
      ? `<available_commands>
    You can help users with the following commands:
    - !askobot or !askowbot: Ask you any question.
    - !bgrank or !bg: Check a player's Hearthstone Battlegrounds rank.
    - !bgrankduo or !bgduo: Check a player's Hearthstone Battlegrounds Duo rank.
    - !arenarank or !ar: Check a player's Hearthstone Arena rank.
    - !card: Get information about a Hearthstone card.
    - !hero: Get information about a Hearthstone hero.
    - !trinket: Get information about a Hearthstone trinket.
    - !spell: Get information about a Hearthstone spell.
    - !anomaly: Get information about a Hearthstone anomaly.
    </available_commands>`
      : `<available_commands>
    You can help users with Discord slash commands:
    - /askobot: Ask you any question directly in Discord.
    </available_commands>`;

  return {
    time: new Date().toLocaleString(),
    mood: randomMood,
    username: user,
    message,
    channelContext: randomContext,
    platform,
    platformInfo,
    availableCommands,
    moods: channelConfig.mood.join(", "),
    maxChar: channelConfig.maxChar,
    animations: config.animations.join(", "),
  };
};

export { createOpenAI, buildPromptVars };
