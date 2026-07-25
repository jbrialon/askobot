import { Fragment } from "react";
import styles from "./chat.module.scss";

const emoteUrl = (id, size = "3.0") =>
  `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/${size}`;

const ChatItem = ({ item }) => {
  return (
    <>
      <div className={styles["ui-chat__user"]}>
        {item.user["display-name"] === "Askowbot" && <div className={styles["ui-chat__avatar"]}></div>}
        <div className={styles["ui-chat__name"]} style={{ color: item.user.color }}>
          {item.user["display-name"]}
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
                src={emoteUrl(part.id)}
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
