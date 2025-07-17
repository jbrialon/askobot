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

  // Robotic and calm
  // voice_settings: {
  //   stability: 1,
  //   similarity_boost: 0.5,
  //   use_speaker_boost: false,
  //   style: 0.1,
  //   speed: 0.9,
  // }
  // Excited
  // voice_settings: {
  //   stability: 0.3,            // Allow emotional variation
  //   similarity_boost: 0.75,    // Keep it close to the voice
  //   use_speaker_boost: true,
  //   style: 0.9,                // High style = more expressive
  //   speed: 1.2,                // Speak faster
  // }

  // pause in text
  // <break time="1.5s" />
  // Helper to sanitize text for TTS
  sanitizeText(text) {
    // Replace @handles with just the username so the bot don't say the "at" (@)
    const handleRegex = /@([\w_]+)/g;
    return text.replace(handleRegex, "$1");
  }

  async convertAsStream({ text, emotion }) {
    try {
      // Sanitize text before sending to TTS
      const cleanText = this.sanitizeText(text);
      console.log(`[TTS]: ${cleanText} (${emotion})`);

      const audioStream = await this.instance.textToSpeech.convertAsStream("1Ju3wgDv0NblqqooMpNg", {
        text: cleanText,
        next_text: `, he said with a ${emotion} voice`,
        model_id: "eleven_flash_v2_5", // eleven_multilingual_v2
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.75,
          use_speaker_boost: true,
          style: 0.5,
          speed: 1,
        },
      });

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
