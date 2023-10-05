import "dotenv/config";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

import express from "express";
import config from "./config.json" assert { type: "json" };

const app = express();

app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, "public")));

console.log(process.env);
// Define a route that accepts a POST request with the prompt in the request body.
app.post("/gpt", async (req, res) => {
  try {
    const { messages } = req.body;
    console.log(req.body);
    if (!messages) {
      return res
        .status(400)
        .json({ error: "Prompt is required in the request body" });
    }

    // Create the request options.
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.APIKEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
      }),
    };

    // Make the POST request to the GPT-3.5 API.
    const response = await fetch(config.apiUrl, requestOptions);

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      res.json({ response: data });
    } else {
      console.error("Error:", response.statusText);
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

app.listen(config.port, () => {
  console.log(`Server Started`);
});
