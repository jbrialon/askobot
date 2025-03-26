import { ElevenLabsClient } from "elevenlabs";
import fs from "fs";

import { EventEmitter } from "events";

export default class Voice extends EventEmitter {
  constructor() {
    super();

    this.instance = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  async convertAsStream(text) {
    const audioStream = await this.instance.textToSpeech.convertAsStream(
      "JBFqnCBsd6RMkjVDRZzb", // Agent ID
      {
        text,
        model_id: "eleven_flash_v2_5",
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: 1,
          similarity_boost: 1.0,
          use_speaker_boost: false,
          speed: 0.85,
        },
      },
    );

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    // Combine chunks into a single Buffer
    const audioBuffer = Buffer.concat(chunks);
    audioBuffer.toString("base64");
    // Emit buffer to frontend (as base64)
    return audioBuffer;
  }
}
