import { staticAuthProvider } from "./auth.js";
import { ChatClient } from "@twurple/chat";

const CHANNEL = "Askowbol";

export const startChatBot = () => {
  const chatClient = new ChatClient({
    authProvider: staticAuthProvider,
    channels: [CHANNEL],
  });

  chatClient.connect();

  chatClient.onMessage((channel, user, text) => {
    console.log(`${channel}: ${user}: ${text}`);
    chatClient.say(CHANNEL, "Hello! SamyZ");
  });
};
