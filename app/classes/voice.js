import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { ToWords } from "to-words";

export default class Voice {
  constructor() {
    this.instance = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    this.toWords = new ToWords({
      localeCode: "fr-FR",
    });
  }

  // Default Agent ID : JBFqnCBsd6RMkjVDRZzb
  // Askobot #1 (claptrap) : dmpjA77eRwk6YUSKBiAv
  // Askobot 2 (voice gen) : HAszShXoWaHgc2vlxgbB
  // Askobot 3 (GladOS) : 1Ju3wgDv0NblqqooMpNg
  // Askobot 4 (voice gen) : PxuZwPMVj1DzmyNotLMi
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
    text = text.replace(handleRegex, "$1");

    // Replace # with "hashtag "
    text = text.replace(/#/g, "hashtag ");

    // Remove emojis
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    return text.replace(emojiRegex, "");
  }

  // Voice normalization for better TTS pronunciation (for flash models)
  normalizeText(text) {
    return (
      text
        // Convert all numbers to words
        .replace(/\b\d+\b/g, (match) => {
          return this.toWords.convert(Number.parseInt(match));
        })
    );
  }

  async convertAsStream({ text, emotion }) {
    try {
      // Sanitize and normalize text before sending to TTS
      let cleanText = this.sanitizeText(text);
      cleanText = this.normalizeText(cleanText);
      console.log(`[TTS]: ${cleanText} (${emotion})`);

      const audioStream = await this.instance.textToSpeech.stream("1Ju3wgDv0NblqqooMpNg", {
        text: cleanText,
        next_text: `, he said with a ${emotion} voice`,
        modelId: "eleven_flash_v2_5", // eleven_multilingual_v2 / eleven_v3
        output_format: "mp3_44100_128",
        voice_settings: {
          // stability: Controls how much variation is allowed in the voice (0-1)
          stability: 0.5,
          // similarity_boost: How closely to match the original voice (0-1)
          similarity_boost: 0.75,
          // use_speaker_boost: Enhances clarity and reduces noise/distortion
          use_speaker_boost: true,
          // style: Controls expressiveness of the voice (0-1)
          style: 0.5,
          // speed: Playback speed multiplier
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
