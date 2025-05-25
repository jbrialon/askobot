import "dotenv/config";

import fs from "fs";
import path from "path";
import { fetchAllCardData } from "../app/utils/battleground.js";
import { log } from "../app/utils/utils.js";

const saveDataToFile = async (outputFilePath) => {
  try {
    log.info({
      user: "System",
      message: "Fetching data for cards",
      channel: "System",
    });
    const cardsData = await fetchAllCardData();
    if (cardsData) {
      // Create the output directory if it doesn't exist
      const outputDir = path.dirname(outputFilePath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save the card data to a JSON file
      fs.writeFileSync(outputFilePath, JSON.stringify(cardsData, null, 2));

      log.success({
        user: "System",
        message: `Cards data saved to: ${outputFilePath}`,
        channel: "System",
      });
    } else {
      log.info({
        user: "System",
        message: `No data found for cards: "${cardName}"`,
        channel: "System",
      });
    }
  } catch (error) {
    log.error({
      user: "System",
      message: `Error saving card data: "${error}"`,
      channel: "System",
    });
  }
};

const outputFilePath = "./db/db.json";

// Fetch and save cards data
saveDataToFile(outputFilePath);
