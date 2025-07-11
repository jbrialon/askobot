import { Fragment } from "react";
import { buildEmoteImageUrl } from "@twurple/chat";
import styles from "./chat.module.scss";

const ChatItem = ({ item }) => {
  return (
    <>
      <div className={styles["ui-chat__user"]}>
        {item.tags["display-name"] === "Askowbot" && <div className={styles["ui-chat__avatar"]}></div>}
        <div className={styles["ui-chat__name"]} style={{ color: item.tags.color }}>
          {item.tags["display-name"]}
        </div>
      </div>
      <div className={styles["ui-chat__message"]}>
        {item.message.map((part, idx) => {
          if (part.type === "text") {
            return <Fragment key={idx}>{part.text}</Fragment>;
          } else if (part.type === "emote") {
            return (
              <img
                key={idx}
                className={styles["ui-chat__emote"]}
                src={buildEmoteImageUrl(part.id, { theme: "light", scale: "3.0" })}
                alt={part.name}
              />
            );
          }
          return null;
        })}
      </div>
    </>
  );
};

export default ChatItem;
