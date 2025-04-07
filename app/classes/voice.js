import { ElevenLabsClient } from "elevenlabs";

export default class Voice {
  constructor() {
    this.instance = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  // Default Agent ID : JBFqnCBsd6RMkjVDRZzb
  // Askobot #1 (claptrap) : dmpjA77eRwk6YUSKBiAv
  // Askobot 2 (voice gen) : HAszShXoWaHgc2vlxgbB
  // Askobot 3 (GladOS) : 1Ju3wgDv0NblqqooMpNg
  async convertAsStream(text) {
    try {
      const audioStream = await this.instance.textToSpeech.convertAsStream(
        "1Ju3wgDv0NblqqooMpNg",
        {
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 1,
            similarity_boost: 0.5,
            use_speaker_boost: true,
            style: 0.5,
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
