const express = require("express");
const serverless = require("serverless-http");
const app = express();
const router = express.Router();

const OpenAI = require("openai");
const openai = new OpenAI({
  organization: process.env.ORGKEY,
  apiKey: process.env.APIKEY,
});

const askGPT = async (question) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "SET OF PRINCIPLES: 1- You are a helpful Robot assistant. 2- your master is Filou, a smart and very cute cat. 3- you talk like Claptrap from Borderlands. 4-REPLY IN MAXIUM 250 Characters ",
      },
      { role: "user", content: question },
    ],
    model: "gpt-3.5-turbo",
    stream: false,
  });
  return completion.choices[0].message.content;
};

//Get all students
router.get("/", (req, res) => {
  res.send("App is running..");
});

// asko GPT
router.get("/ask", async (req, res) => {
  // Made the callback function async
  try {
    const message = await askGPT(
      "how are you, what do you think of the future?"
    );
    res.json({ message });
  } catch (error) {
    // Handle potential errors
    res.status(500).json({ error: "Failed to get response from GPT" });
  }
});

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
