import "dotenv/config";

import fs from "fs";
import path from "path";
import { fetchAllCardData } from "../battleground.js";
import { log } from "../utils/utils.js";

const saveDataToFile = async (outputFilePath) => {
  try {
    console.log("Fetching data for cards");
    log
      .infoMessage()
      .addTitle("Import ")
      .addDescription("Fetching data for cards")
      .sendMessage();
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
      log
        .sucessfulMessage()
        .addTitle("Import Success")
        .addDescription(`Cards data saved to: ${outputFilePath}`)
        .sendMessage();
    } else {
      console.log(`No data found for cards: "${cardName}"`);
      log
        .warningMessage()
        .addTitle("Import Fail")
        .addDescription(`No data found for cards: "${cardName}"`)
        .sendMessage();
    }
  } catch (error) {
    log
      .errorMessage()
      .addTitle("Import Error")
      .addDescription(`Error saving card data: "${error}"`)
      .sendMessage();
  }
};

const outputFilePath = "./db/db.json";

// Fetch and save cards data
saveDataToFile(outputFilePath);
