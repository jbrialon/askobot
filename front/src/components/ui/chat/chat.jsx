import { useState } from "react";
import ChatItem from "./chatItem";
import { parseEmotesInMessage, getEmoteAsUrl } from "tmi-utils";
import "./chat.scss";

const Chat = ({ socket }) => {
  const [chatHistory, setChatHistory] = useState([]);

  socket.on("history", (history) => {
    const parsed = history
      .filter((item) => item.channel === "#askowbol")
      .map((item) => ({
        ...item,
        parsedMessage: parseEmotesInMessage(item.tags.emotes, item.message).map(
          (message, index, arr) => {
            if (message.type === "text") {
              let value = message.value;
              if (index === 0) value = value.replace(/^🤖\s*/, "");
              if (index === arr.length - 1) value = value.replace(/\s*🤖$/, "");
              return { ...message, value };
            }
            return {
              ...message,
              ...(message.type === "emote" && {
                src: getEmoteAsUrl(message.value),
              }),
            };
          },
        ),
      }))
      .slice(-4);

    setChatHistory(parsed);
  });

  return (
    <div className="chat">
      <ul>
        {chatHistory.map((item, index) => (
          <ChatItem key={index} item={item} />
        ))}
      </ul>
    </div>
  );
};

export default Chat;
