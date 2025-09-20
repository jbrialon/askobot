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

    const messages = [
      ...(context ? [{ role: "system", content: context }] : []),
      ...history,
      {
        role: "user",
        content: promptVars.username ? `@${promptVars.username}: ${promptVars.message}` : promptVars.message,
      },
    ];
    const options = {
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined, // TODO
      response_format: zodSchema ? zodResponseFormat(zodSchema, "structured_output") : undefined,
    };
    try {
      const response = await openai.chat.completions.create(options);
      let content = response.choices[0].message.content;
      content = jsonrepair(content);
      const jsonResponse = JSON.parse(content);
      return zodSchema ? zodSchema.parse(jsonResponse) : jsonResponse;
    } catch (error) {
      throw new Error(error);
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
    platformInfo,
    availableCommands,
    moods: channelConfig.mood.join(", "),
    maxChar: channelConfig.maxChar,
    animations: config.animations.join(", "),
  };
};

export { createOpenAI, buildPromptVars };
