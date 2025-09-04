import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatItem from "./chatItem";
import Manager from "@/classes/manager";
import styles from "./chat.module.scss";

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
        .map((item) => ({
          ...item,
          message: item.message,
        }))
        .slice(-2);

      setChatHistory(parsed);
    };

    manager.on("chat-history", handler);
    return () => manager.off("chat-history", handler);
  }, []);

  return (
    <div className={styles["ui-chat"]}>
      <motion.ul className={styles["ui-chat__list"]} layout>
        <AnimatePresence initial={false}>
          {chatHistory.map((item) => (
            <motion.li
              className={styles["ui-chat__list-item"]}
              layout
              key={item.timestamp}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.5 }}
            >
              <ChatItem key={item.timestamp} item={item} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
};

export default Chat;
