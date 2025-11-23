import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, SupportedLanguage } from "../types";
import { decodeBase64, decodeAudioData } from "./audioUtils";

// Helper to get the AI client instance lazily
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    // Initialize with provided key or empty string to prevent constructor crash
    ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return ai;
}

function checkApiKey() {
  const key = process.env.API_KEY;
  if (!key || key.length === 0 || key === 'undefined') {
    const error = new Error("API_KEY_MISSING");
    error.name = "ConfigError";
    throw error;
  }
}

export function hasApiKey(): boolean {
  const key = process.env.API_KEY;
  return !!(key && key.length > 0 && key !== 'undefined');
}

// API Base Voice Names
const API_VOICES = {
  FENRIR: 'Fenrir', // Deep, intense
  CHARON: 'Charon', // Deep, articulate
  PUCK: 'Puck',     // Higher, energetic
  KORE: 'Kore',     // Female, calm
  ZEPHYR: 'Zephyr', // Female, gentle
};

// Configuration Map
const VOICE_CONFIG_MAP: Record<VoiceName, { apiVoice: string; style: string }> = {
  // --- CELEBRITIES: YouTubers ---
  [VoiceName.Celeb_Beast]: { apiVoice: API_VOICES.PUCK, style: "Hyper-energetic, loud, fast-paced, shouting slightly, excited YouTuber" },
  [VoiceName.Celeb_Pewds]: { apiVoice: API_VOICES.PUCK, style: "Chaotic, expressive, loud, fluctuating pitch, gamer" },
  [VoiceName.Celeb_Mark]: { apiVoice: API_VOICES.FENRIR, style: "Deep, booming, radio-like, dramatic YouTuber" },
  [VoiceName.Celeb_Logan]: { apiVoice: API_VOICES.PUCK, style: "Very fast, aggressive, hype-beast, vlogger" },
  [VoiceName.Celeb_TechGuy]: { apiVoice: API_VOICES.CHARON, style: "Crisp, clear, articulate, professional tech reviewer" },
  [VoiceName.Celeb_GaryVee]: { apiVoice: API_VOICES.PUCK, style: "Raspy, fast-paced, aggressive, motivational, swearing style" },
  [VoiceName.Celeb_Rogan]: { apiVoice: API_VOICES.FENRIR, style: "Deep, conversational, relaxed, inquisitive, stoner vibe" },

  // --- CELEBRITIES: Tech ---
  [VoiceName.Celeb_Elon]: { apiVoice: API_VOICES.FENRIR, style: "Deep, mumbling slightly, thoughtful pauses, tech visionary" },
  [VoiceName.Celeb_Zuck]: { apiVoice: API_VOICES.PUCK, style: "Monotone, flat, very polite, rapid but robotic" },
  [VoiceName.Celeb_Jobs]: { apiVoice: API_VOICES.CHARON, style: "Slow, deliberate, mesmerizing, visionary presentation" },
  [VoiceName.Celeb_Gates]: { apiVoice: API_VOICES.PUCK, style: "Nasally, intellectual, fast-paced, nerdy" },
  [VoiceName.Celeb_Bezos]: { apiVoice: API_VOICES.PUCK, style: "Loud, enthusiastic, laughing, energetic CEO" },

  // --- CELEBRITIES: Hollywood (Male) ---
  [VoiceName.Celeb_Morgan]: { apiVoice: API_VOICES.CHARON, style: "God-like, extremely deep, slow, wise, soulful narrator" },
  [VoiceName.Celeb_Samuel]: { apiVoice: API_VOICES.FENRIR, style: "Aggressive, sharp, intense, swearing-style cadence" },
  [VoiceName.Celeb_Arnold]: { apiVoice: API_VOICES.FENRIR, style: "Thick Austrian accent, robotic, deep, authoritative" },
  [VoiceName.Celeb_Keanu]: { apiVoice: API_VOICES.FENRIR, style: "Breathless, whispery, intense, cool, surfer-vibe" },
  [VoiceName.Celeb_Rock]: { apiVoice: API_VOICES.CHARON, style: "Confident, charming, electrifying, deep" },
  [VoiceName.Celeb_DeNiro]: { apiVoice: API_VOICES.FENRIR, style: "New York accent, squinting tone, mumbly, tough guy" },
  [VoiceName.Celeb_RDJ]: { apiVoice: API_VOICES.PUCK, style: "Fast, witty, sarcastic, arrogant, charming" },
  [VoiceName.Celeb_ChrisH]: { apiVoice: API_VOICES.CHARON, style: "Booming, deep, royal, shakesperean, strong" },
  [VoiceName.Celeb_ChrisE]: { apiVoice: API_VOICES.CHARON, style: "Honest, earnest, deep, commanding, leader" },
  [VoiceName.Celeb_RyanR]: { apiVoice: API_VOICES.PUCK, style: "Sarcastic, high energy, breaking the fourth wall, quippy" },
  [VoiceName.Celeb_WillSmith]: { apiVoice: API_VOICES.CHARON, style: "Energetic, smooth, charismatic, loud, funny" },
  [VoiceName.Celeb_Leo]: { apiVoice: API_VOICES.PUCK, style: "Intense, shouting, high energy, desperate, sales pitch" },
  [VoiceName.Celeb_Brad]: { apiVoice: API_VOICES.FENRIR, style: "Cool, low pitch, confident, detached, mumbly" },
  [VoiceName.Celeb_TomC]: { apiVoice: API_VOICES.FENRIR, style: "Intense, focused, clear, breathless, action star" },
  [VoiceName.Celeb_Johnny]: { apiVoice: API_VOICES.FENRIR, style: "Slurred, British affectation, witty, drunk pirate" },
  [VoiceName.Celeb_Denzel]: { apiVoice: API_VOICES.CHARON, style: "Calm, slow, authoritative, threateningly polite" },
  [VoiceName.Celeb_Hugh]: { apiVoice: API_VOICES.FENRIR, style: "Growling, angry, australian twang, deep" },
  [VoiceName.Celeb_Liam]: { apiVoice: API_VOICES.FENRIR, style: "Gravelly, whispery, threatening, irish lilt" },
  [VoiceName.Celeb_Vin]: { apiVoice: API_VOICES.CHARON, style: "Extremely deep, rumbling, slow, family oriented" },
  [VoiceName.Celeb_Jason]: { apiVoice: API_VOICES.FENRIR, style: "Rough, cockney, fast, aggressive, tough" },

  // --- CELEBRITIES: Hollywood (Female) ---
  [VoiceName.Celeb_ScarJo]: { apiVoice: API_VOICES.KORE, style: "Raspy, deep female voice, smooth, sultry" },
  [VoiceName.Celeb_Marilyn]: { apiVoice: API_VOICES.ZEPHYR, style: "Breathy, high-pitched, sweet, classic hollywood" },
  [VoiceName.Celeb_Angelina]: { apiVoice: API_VOICES.KORE, style: "British accent, dark, sophisticated, elegant" },
  [VoiceName.Celeb_JLaw]: { apiVoice: API_VOICES.KORE, style: "Husky, relatable, casual, american" },
  [VoiceName.Celeb_Meryl]: { apiVoice: API_VOICES.KORE, style: "Icy, precise, soft but terrifying, authoritative" },
  [VoiceName.Celeb_Gal]: { apiVoice: API_VOICES.KORE, style: "Exotic accent, strong, warm, deep" },
  [VoiceName.Celeb_Margot]: { apiVoice: API_VOICES.ZEPHYR, style: "High pitched, brooklyn accent, manic, crazy" },
  [VoiceName.Celeb_Emma]: { apiVoice: API_VOICES.ZEPHYR, style: "British, articulate, smart, lecture style" },
  [VoiceName.Celeb_Zendaya]: { apiVoice: API_VOICES.ZEPHYR, style: "Chill, vocal fry, cool, modern" },

  // --- CELEBRITIES: Musicians ---
  [VoiceName.Celeb_Taylor]: { apiVoice: API_VOICES.KORE, style: "Sweet, melodic, clear, american pop star" },
  [VoiceName.Celeb_Billie]: { apiVoice: API_VOICES.ZEPHYR, style: "Whispering, vocal fry, dark, soft, cool" },
  [VoiceName.Celeb_Kanye]: { apiVoice: API_VOICES.FENRIR, style: "Erratic, confident, interrupting, chicago accent" },
  [VoiceName.Celeb_Drake]: { apiVoice: API_VOICES.CHARON, style: "Smooth, monotone, relaxed, canadian-american" },
  [VoiceName.Celeb_Adele]: { apiVoice: API_VOICES.KORE, style: "Thick Cockney accent, soulful, deep, loud" },
  [VoiceName.Celeb_Eminem]: { apiVoice: API_VOICES.PUCK, style: "Nasal, rapid fire, angry, rhythmic, detroit accent" },
  [VoiceName.Celeb_Beyonce]: { apiVoice: API_VOICES.KORE, style: "Powerful, resonant, commanding, diva" },
  [VoiceName.Celeb_Rihanna]: { apiVoice: API_VOICES.KORE, style: "Bajan accent, cool, attitude, deep" },
  [VoiceName.Celeb_JustinB]: { apiVoice: API_VOICES.PUCK, style: "Soft, breathy, melodic, young male" },
  [VoiceName.Celeb_Ariana]: { apiVoice: API_VOICES.ZEPHYR, style: "High pitched, airy, sweet, fast" },
  [VoiceName.Celeb_Ed]: { apiVoice: API_VOICES.PUCK, style: "Soft British accent, folk singer, friendly" },
  [VoiceName.Celeb_Bruno]: { apiVoice: API_VOICES.PUCK, style: "Bright, energetic, tenor, funk style" },
  [VoiceName.Celeb_Weeknd]: { apiVoice: API_VOICES.ZEPHYR, style: "Falsetto, soft, dark, moody" },
  [VoiceName.Celeb_Snoop]: { apiVoice: API_VOICES.FENRIR, style: "Extremely slow, laid back, west coast drawl, stoned" },
  [VoiceName.Celeb_JayZ]: { apiVoice: API_VOICES.CHARON, style: "Confident, slow, articulate, new york business" },

  // --- Icons & Historical ---
  [VoiceName.Celeb_Obama]: { apiVoice: API_VOICES.CHARON, style: "Rhythmic, pausing, melodic, presidential, deep" },
  [VoiceName.Celeb_Trump]: { apiVoice: API_VOICES.FENRIR, style: "Raspy, repetitive, confident, distinctive new york" },
  [VoiceName.Celeb_Attenborough]: { apiVoice: API_VOICES.CHARON, style: "Whispered, awestruck, british, nature narrator" },
  [VoiceName.Celeb_Gordon]: { apiVoice: API_VOICES.FENRIR, style: "Shouting, angry, british, aggressive, critical" },
  [VoiceName.Celeb_Oprah]: { apiVoice: API_VOICES.KORE, style: "Loud, enthusiastic, projecting, welcoming, interview" },
  [VoiceName.Celeb_Ellen]: { apiVoice: API_VOICES.ZEPHYR, style: "Casual, friendly, light, conversational" },
  [VoiceName.Celeb_MLK]: { apiVoice: API_VOICES.CHARON, style: "Booming, slow, rhythmic, preacher style" },
  [VoiceName.Celeb_JFK]: { apiVoice: API_VOICES.PUCK, style: "Fast, boston accent, charismatic, politician" },
  [VoiceName.Celeb_Churchill]: { apiVoice: API_VOICES.FENRIR, style: "Mumbly, deep, british, grumpy, authoritative" },
  [VoiceName.Celeb_Einstein]: { apiVoice: API_VOICES.FENRIR, style: "Soft, german accent, thoughtful, genius" },
  [VoiceName.Celeb_Gandhi]: { apiVoice: API_VOICES.FENRIR, style: "Very soft, weak, indian accent, peaceful" },

  // --- Fictional Characters ---
  [VoiceName.Char_Batman]: { apiVoice: API_VOICES.FENRIR, style: "Gravelly, deep, whispery, threatening" },
  [VoiceName.Char_Joker]: { apiVoice: API_VOICES.PUCK, style: "High pitched, manic, laughing, terrifying" },
  [VoiceName.Char_Vader]: { apiVoice: API_VOICES.CHARON, style: "Deepest possible, mechanical breathing, slow, evil" },
  [VoiceName.Char_Yoda]: { apiVoice: API_VOICES.FENRIR, style: "Croaky, old, strange syntax, wise" },
  [VoiceName.Char_Gollum]: { apiVoice: API_VOICES.PUCK, style: "Choked, throat-shredding, raspy, dual personality" },
  [VoiceName.Char_Bond]: { apiVoice: API_VOICES.CHARON, style: "British, suave, calm, dangerous, seductive" },
  [VoiceName.Char_Stark]: { apiVoice: API_VOICES.PUCK, style: "Filtered, metallic, jarvis-like, sarcastic" },
  [VoiceName.Char_Captain]: { apiVoice: API_VOICES.CHARON, style: "Honest, earnest, deep, commanding, leader" },
  [VoiceName.Char_Thor]: { apiVoice: API_VOICES.CHARON, style: "Booming, deep, royal, shakesperean, strong" },
  [VoiceName.Char_Optimus]: { apiVoice: API_VOICES.CHARON, style: "Booming, metallic, noble, leader" },
  [VoiceName.Char_Sherlock]: { apiVoice: API_VOICES.PUCK, style: "Rapid fire, arrogant, british, deduction" },
  [VoiceName.Char_Potter]: { apiVoice: API_VOICES.PUCK, style: "British, young, brave, student" },
  [VoiceName.Char_Wizard]: { apiVoice: API_VOICES.CHARON, style: "Ancient, raspy, wise wizard" },
  [VoiceName.Char_Villain]: { apiVoice: API_VOICES.CHARON, style: "Dark, smooth, menacing villain" },
  [VoiceName.Char_Hero]: { apiVoice: API_VOICES.FENRIR, style: "Breathless, gritty, intense action hero" },
  [VoiceName.Char_Robot]: { apiVoice: API_VOICES.FENRIR, style: "Monotone, staccato, emotionless robot" },
  [VoiceName.Char_Cyberpunk]: { apiVoice: API_VOICES.PUCK, style: "Cool, detached, edgy street-smart" },
  [VoiceName.Char_OldMan]: { apiVoice: API_VOICES.FENRIR, style: "Shaky, cracked, very old man" },
  [VoiceName.Char_OldWoman]: { apiVoice: API_VOICES.ZEPHYR, style: "Shaky, weak, very old woman" },
  [VoiceName.Char_ChildLike]: { apiVoice: API_VOICES.PUCK, style: "High-pitched, energetic, innocent child" },
  [VoiceName.Char_Pirate]: { apiVoice: API_VOICES.FENRIR, style: "Gravelly, slur, nautical slang, intense" },
  [VoiceName.Char_Soldier]: { apiVoice: API_VOICES.FENRIR, style: "Barking orders, sharp, disciplined" },

  // --- Storytelling & Generic ---
  [VoiceName.Narrator_Deep]: { apiVoice: API_VOICES.CHARON, style: "Deep, epic, authoritative narrator" },
  [VoiceName.Narrator_Soft]: { apiVoice: API_VOICES.ZEPHYR, style: "Soft, soothing, motherly storytelling" },
  [VoiceName.Movie_Trailer]: { apiVoice: API_VOICES.FENRIR, style: "Deep, gravelly, booming movie trailer" },
  [VoiceName.Storyteller_Fantasy]: { apiVoice: API_VOICES.CHARON, style: "Whimsical, theatrical, magical" },
  [VoiceName.Documentary_Nature]: { apiVoice: API_VOICES.FENRIR, style: "Hushed, observational, intense documentary" },
  [VoiceName.Audiobook_Classic]: { apiVoice: API_VOICES.KORE, style: "Proper, articulate, well-paced literary" },
  [VoiceName.News_Anchor_Male]: { apiVoice: API_VOICES.CHARON, style: "Professional, neutral, clear news anchor" },
  [VoiceName.News_Anchor_Female]: { apiVoice: API_VOICES.KORE, style: "Sharp, professional, clear broadcast" },
  [VoiceName.CEO_Confident]: { apiVoice: API_VOICES.CHARON, style: "Confident, assertive, corporate leadership" },
  [VoiceName.Motivational_Speaker]: { apiVoice: API_VOICES.PUCK, style: "High energy, inspiring, driving force" },
  [VoiceName.Customer_Support_Friendly]: { apiVoice: API_VOICES.ZEPHYR, style: "Very friendly, bright, helpful customer service" },
  [VoiceName.Therapist_Calm]: { apiVoice: API_VOICES.KORE, style: "Slow, empathetic, validating therapist" },
  [VoiceName.Professor_Academic]: { apiVoice: API_VOICES.CHARON, style: "Slow, wise, explanatory academic" },
  [VoiceName.Emotion_Happy]: { apiVoice: API_VOICES.PUCK, style: "Cheerful, laughter, joy, big smile" },
  [VoiceName.Emotion_Sad]: { apiVoice: API_VOICES.FENRIR, style: "Slow, quiet, deep sorrow, melancholy" },
  [VoiceName.Emotion_Angry]: { apiVoice: API_VOICES.FENRIR, style: "Loud, aggressive, intense anger" },
  [VoiceName.Emotion_Excited]: { apiVoice: API_VOICES.PUCK, style: "Very fast, high pitch, thrilled excitement" },
  [VoiceName.Emotion_Whisper]: { apiVoice: API_VOICES.ZEPHYR, style: "Whispering, quiet, intimate, ASMR" },
  [VoiceName.Emotion_Nervous]: { apiVoice: API_VOICES.PUCK, style: "Fast, stuttering, shaky, nervous" },
  [VoiceName.Emotion_Sarcastic]: { apiVoice: API_VOICES.CHARON, style: "Deadpan, dry, biting sarcasm" },

  // --- Base Voices ---
  [VoiceName.Base_Fenrir]: { apiVoice: API_VOICES.FENRIR, style: "Deep, intense, generic male" },
  [VoiceName.Base_Charon]: { apiVoice: API_VOICES.CHARON, style: "Deep, articulate, generic male" },
  [VoiceName.Base_Kore]: { apiVoice: API_VOICES.KORE, style: "Calm, female, generic" },
  [VoiceName.Base_Zephyr]: { apiVoice: API_VOICES.ZEPHYR, style: "Gentle, female, generic" },
  [VoiceName.Base_Puck]: { apiVoice: API_VOICES.PUCK, style: "Energetic, male, generic" },

  // --- Accents ---
  [VoiceName.Accent_British_Posh]: { apiVoice: API_VOICES.CHARON, style: "Sophisticated, upper-class British" },
  [VoiceName.Accent_British_Cockney]: { apiVoice: API_VOICES.PUCK, style: "Rough, working-class London" },
  [VoiceName.Accent_American_Southern]: { apiVoice: API_VOICES.FENRIR, style: "Slow, drawl, deep Southern" },
  [VoiceName.Accent_American_NewYork]: { apiVoice: API_VOICES.PUCK, style: "Fast, aggressive, New York" },
  [VoiceName.Accent_American_Boston]: { apiVoice: API_VOICES.PUCK, style: "Distinct vowel sounds, fast" },
  [VoiceName.Accent_Indian_Male]: { apiVoice: API_VOICES.FENRIR, style: "Clear English, Indian accent" },
  [VoiceName.Accent_Indian_Female]: { apiVoice: API_VOICES.ZEPHYR, style: "Clear English, Indian accent, soft" },
  [VoiceName.Accent_Australian]: { apiVoice: API_VOICES.PUCK, style: "Laid back, upward inflection" },
  [VoiceName.Accent_Irish]: { apiVoice: API_VOICES.PUCK, style: "Lilting, melodic, Irish" },
  [VoiceName.Accent_Scottish]: { apiVoice: API_VOICES.FENRIR, style: "Guttural, rolling R's" },
  [VoiceName.Accent_Russian]: { apiVoice: API_VOICES.FENRIR, style: "Heavy, thick, intimidating" },
  [VoiceName.Accent_French]: { apiVoice: API_VOICES.CHARON, style: "Soft, nasal, romantic" },
  [VoiceName.Accent_Japanese]: { apiVoice: API_VOICES.FENRIR, style: "Precise, staccato" },
  [VoiceName.Accent_German]: { apiVoice: API_VOICES.FENRIR, style: "Stern, precise" },
  [VoiceName.Accent_Italian]: { apiVoice: API_VOICES.PUCK, style: "Expressive, melodic" },
  [VoiceName.Accent_Spanish]: { apiVoice: API_VOICES.PUCK, style: "Fast, passionate" },

  // --- Atmosphere ---
  [VoiceName.Atmosphere_ASMR]: { apiVoice: API_VOICES.ZEPHYR, style: "Whispering, soft, close to mic" },
  [VoiceName.Atmosphere_Meditative]: { apiVoice: API_VOICES.KORE, style: "Slow, breathing, calm" },
  [VoiceName.Atmosphere_Poetic]: { apiVoice: API_VOICES.CHARON, style: "Rhythmic, emotional" },
  [VoiceName.Atmosphere_Sports]: { apiVoice: API_VOICES.PUCK, style: "High energy, shouting" },
  [VoiceName.Atmosphere_Radio]: { apiVoice: API_VOICES.FENRIR, style: "Deep, compressed, announcer" },
  [VoiceName.Atmosphere_Horror]: { apiVoice: API_VOICES.FENRIR, style: "Creepy, slow, unsettling" },
};


export async function generateSpeech(
  text: string,
  voiceName: VoiceName,
  language: SupportedLanguage,
  audioContext: AudioContext,
  speed: number = 1.0,
  highQuality: boolean = true
): Promise<AudioBuffer> {
  checkApiKey();
  
  const client = getAI();
  const config = VOICE_CONFIG_MAP[voiceName];
  const voiceConfig = config || { apiVoice: API_VOICES.PUCK, style: 'Neutral' };

  const promptText = `
    Say the following text: "${text}"
    
    Style instructions: ${voiceConfig.style}
    Language: ${language}
  `;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceConfig.apiVoice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("No audio generated from Gemini. Check your API Key and quota.");
  }

  const audioBytes = decodeBase64(base64Audio);
  return await decodeAudioData(audioBytes, audioContext);
}

export async function refineTextWithAI(text: string, voiceName: VoiceName): Promise<string> {
  checkApiKey();
  const client = getAI();
  const config = VOICE_CONFIG_MAP[voiceName];
  const style = config ? config.style : "Clear and professional";
  
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Rewrite the following text to match this style description: "${style}". Keep the meaning the same but enhance the tone. Text: "${text}"`,
  });
  
  return response.text || text;
}

export async function translateText(text: string, targetLanguage: SupportedLanguage): Promise<string> {
  checkApiKey();
  const client = getAI();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Translate the following text to ${targetLanguage}. Return only the translated text. Text: "${text}"`,
  });
  
  return response.text || text;
}