import "dotenv/config";

import fs from "fs";
import path from "path";
import { fetchAllCardData } from "../battleground.js";
import { log } from "../utils/utils.js";

const saveDataToFile = async (outputFilePath) => {
  try {
    console.log("Fetching data for cards");
    log("Fetching data for cards");
    const cardsData = await fetchAllCardData();
    if (cardsData) {
      // Create the output directory if it doesn't exist
      const outputDir = path.dirname(outputFilePath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save the card data to a JSON file
      fs.writeFileSync(outputFilePath, JSON.stringify(cardsData, null, 2));

      console.log(`Cards data saved to: ${outputFilePath}`);
      log(`Cards data saved to: ${outputFilePath}`);
    } else {
      console.log(`No data found for cards: "${cardName}"`);
      log(`No data found for cards: "${cardName}"`);
    }
  } catch (error) {
    log("Error saving card data:", error);
  }
};

const outputFilePath = "./db/db.json";

// Fetch and save cards data
saveDataToFile(outputFilePath);
