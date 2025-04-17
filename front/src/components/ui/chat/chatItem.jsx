import { Fragment } from "react";
import styles from "./chat.module.scss";

const ChatItem = ({ item }) => {
  return (
    <>
      <div className={styles["ui-chat__user"]}>
        {item.tags["display-name"] === "Askowbot" && (
          <div className={styles["ui-chat__avatar"]}></div>
        )}
        <div
          className={styles["ui-chat__name"]}
          style={{ color: item.tags.color }}
        >
          {item.tags["display-name"]}
        </div>
      </div>
      <div className={styles["ui-chat__message"]}>
        {item.parsedMessage.map((message, idx) =>
          message.type === "text" ? (
            <Fragment key={idx}>{message.value}</Fragment>
          ) : message.type === "emote" ? (
            <img
              key={idx}
              className={styles["ui-chat__emote"]}
              src={message.src}
              alt="emote"
            />
          ) : null,
        )}
      </div>
    </>
  );
};

export default ChatItem;
