import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import { zodResponseFormat } from "openai/helpers/zod";
import config from "../../config.js";

const createOpenAI = () => {
  const openai = new OpenAI({
    organization: process.env.ORGKEY,
    apiKey: process.env.APIKEY,
  });

  return async function aiFunction({
    model = "gpt-4.1-nano",
    prompt,
    promptVars = {},
    history = [],
    tools = [],
    outputSchema,
  }) {
    const zodSchema = outputSchema || null;

    promptVars.prompt = prompt;

    const context = Object.entries(promptVars).reduce(
      (p, [key, value]) => p.replace(`\${${key}}`, value),
      config.genericContext,
    );

    const messages = [
      ...(context ? [{ role: "system", content: context }] : []),
      ...history,
      {
        role: "user",
        content: promptVars.username
          ? `@${promptVars.username}: ${promptVars.message}`
          : promptVars.message,
      },
    ];

    const options = {
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined, // TODO
      response_format: zodSchema
        ? zodResponseFormat(zodSchema, "structured_output")
        : undefined,
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

const buildPromptVars = ({ user, message, channelConfig, channelInfo }) => {
  const randomMood =
    channelConfig.mood[Math.floor(Math.random() * channelConfig.mood.length)];
  const randomContext =
    channelConfig.context[
      Math.floor(Math.random() * channelConfig.context.length)
    ];

  return {
    time: new Date().toLocaleString(),
    mood: randomMood,
    username: user.name,
    message,
    channelContext: randomContext,
    title: channelInfo.title,
    game: channelInfo.game,
    desc: channelInfo.description,
    moods: channelConfig.mood.join(", "),
    maxChar: channelConfig.maxChar,
    animations: config.animations.join(", "),
  };
};

export { createOpenAI, buildPromptVars };
