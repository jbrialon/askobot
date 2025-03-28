import React from "react";

const ChatItem = ({ item }) => {
  return (
    <>
      <div className="user">
        {item.tags["display-name"] === "Askowbot" && (
          <div className="avatar"></div>
        )}
        <div className="name" style={{ color: item.tags.color }}>
          {item.tags["display-name"]}
        </div>
      </div>
      <div className="message">
        {item.parsedMessage.map((message, idx) =>
          message.type === "text" ? (
            <React.Fragment key={idx}>{message.value}</React.Fragment>
          ) : message.type === "emote" ? (
            <img key={idx} className="emote" src={message.src} alt="emote" />
          ) : null,
        )}
      </div>
    </>
  );
};

export default ChatItem;
