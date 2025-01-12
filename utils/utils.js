import fetch from "node-fetch";

const getCurrentTimeOfDay = () => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return "morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    return "afternoon";
  } else if (currentHour >= 17 && currentHour < 20) {
    return "evening";
  } else {
    return "night";
  }
};

const log = (channel, user, message) => {
  var params = {
    username: process.env.TWITCH_BOT_USERNAM,
    embeds: [
      {
        author: {
          name: channel,
        },
        title: user,
        description: message,
      },
    ],
  };
  fetch(process.env.DISCORD_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(params),
  }).then((res) => {
    // console.log(res);
  });
};

// Function to add French ordinal suffixes
const getFrenchOrdinal = (rank) => {
  if (rank === 1) return `${rank}er`; // "1er" for 1st place
  return `${rank}ème`; // "2ème", "3ème", etc. for other ranks
};

const cleanText = (text) => {
  return text.replace(/<\/?(b|i)>/g, ""); // Removes <b>, </b>, <i>, and </i> tags};
};
export { getCurrentTimeOfDay, log, getFrenchOrdinal, cleanText };
