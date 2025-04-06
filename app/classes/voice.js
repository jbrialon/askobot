import { ElevenLabsClient } from "elevenlabs";

export default class Voice {
  constructor() {
    this.instance = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  async convertAsStream(text) {
    try {
      const audioStream = await this.instance.textToSpeech.convertAsStream(
        "dmpjA77eRwk6YUSKBiAv", // Agent ID (default agend id : JBFqnCBsd6RMkjVDRZzb)
        {
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 1,
            similarity_boost: 1.0,
            use_speaker_boost: true,
            speed: 1,
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
      return audioBuffer;
    } catch (error) {
      console.error("Error during text-to-speech conversion:", error);
      return null;
    }
  }
}
