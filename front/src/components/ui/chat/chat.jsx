import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseEmotesInMessage, getEmoteAsUrl } from "tmi-utils";
import ChatItem from "./chatItem";
import Manager from "../../../classes/manager";
import "./chat.scss";

const Chat = () => {
  const manager = new Manager();

  const [chatHistory, setChatHistory] = useState([]);

  const variants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, y: -30 },
  };

  useEffect(() => {
    const handler = (e) => {
      const history = e.detail;
      const parsed = history
        .filter((item) => item.channel === "#askowbol")
        .map((item) => ({
          ...item,
          parsedMessage: parseEmotesInMessage(
            item.tags.emotes,
            item.message,
          ).map((message, index, arr) => {
            if (message.type === "text") {
              let value = message.value.trim();
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
          }),
        }))
        .slice(-2);

      setChatHistory(parsed);
    };

    manager.on("history", handler);
    return () => manager.off("history", handler);
  }, []);

  return (
    <div className="ui-chat">
      <motion.ul layout>
        <AnimatePresence initial={false}>
          {chatHistory.map((item) => (
            <motion.li
              layout
              key={item.tags.timestamp}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.5 }}
            >
              <ChatItem key={item.tags.timestamp} item={item} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
};

export default Chat;
