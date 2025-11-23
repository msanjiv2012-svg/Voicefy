import { VoiceName, VoiceOption } from './types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  // --- CELEBRITIES: YouTubers ---
  { id: VoiceName.Celeb_Beast, name: 'The Viral Beast', gender: 'Male', style: 'Hyper-Energetic', description: 'Loud, fast-paced, high-retention YouTube intro style.' },
  { id: VoiceName.Celeb_Pewds, name: 'Internet King', gender: 'Male', style: 'Chaotic & Fun', description: 'Energetic, gamer-style, loud and expressive.' },
  { id: VoiceName.Celeb_TechGuy, name: 'Tech Reviewer', gender: 'Male', style: 'Crisp & Modern', description: 'High quality, precise tech reviewer cadence.' },
  { id: VoiceName.Celeb_Logan, name: 'Vlogger Energy', gender: 'Male', style: 'Hype', description: 'Very fast, aggressive, confident vlogger style.' },
  { id: VoiceName.Celeb_GaryVee, name: 'Hustle Guru', gender: 'Male', style: 'Raspy & Intense', description: 'Fast, motivational, no-nonsense hustle talk.' },
  { id: VoiceName.Celeb_Rogan, name: 'Podcast Host', gender: 'Male', style: 'Conversational', description: 'Relaxed, curious, deep conversationalist.' },

  // --- CELEBRITIES: Hollywood (Male) ---
  { id: VoiceName.Celeb_Morgan, name: 'God Voice', gender: 'Male', style: 'Wise & Deep', description: 'The ultimate narrator voice. Slow, deep, and soulful.' },
  { id: VoiceName.Celeb_Samuel, name: 'The Bad MF', gender: 'Male', style: 'Intense & Sharp', description: 'Distinctive, punchy, and attitude-filled delivery.' },
  { id: VoiceName.Celeb_Arnold, name: 'The Terminator', gender: 'Male', style: 'Heavy Accent', description: 'Iconic Austrian action hero accent.' },
  { id: VoiceName.Celeb_Keanu, name: 'The One', gender: 'Male', style: 'Breathless & Cool', description: 'Soft-spoken, intense, and thoughtful action star.' },
  { id: VoiceName.Celeb_Rock, name: 'The Rock', gender: 'Male', style: 'Electrifying', description: 'Confident, charming, and powerful.' },
  { id: VoiceName.Celeb_RDJ, name: 'Iron Man', gender: 'Male', style: 'Witty & Fast', description: 'Sarcastic, fast-talking, charming genius.' },
  { id: VoiceName.Celeb_RyanR, name: 'Deadpool', gender: 'Male', style: 'Sarcastic', description: 'High energy, quippy, and breaking the fourth wall.' },
  { id: VoiceName.Celeb_WillSmith, name: 'Fresh Prince', gender: 'Male', style: 'Charismatic', description: 'Smooth, energetic, and full of personality.' },
  { id: VoiceName.Celeb_Leo, name: 'Wolf of Wall St', gender: 'Male', style: 'Intense Shout', description: 'High energy, screaming sales pitch style.' },
  { id: VoiceName.Celeb_Brad, name: 'Fight Club', gender: 'Male', style: 'Cool & Laid-back', description: 'Effortlessly cool, low pitch, confident.' },
  { id: VoiceName.Celeb_TomC, name: 'Maverick', gender: 'Male', style: 'Action Star', description: 'Intense, focused, high-stakes delivery.' },
  { id: VoiceName.Celeb_Johnny, name: 'Captain Jack', gender: 'Male', style: 'Slurred & Witty', description: 'Drunken slur, witty, charming pirate.' },
  { id: VoiceName.Celeb_Denzel, name: 'Equalizer', gender: 'Male', style: 'Authoritative', description: 'Calm, slow, extremely threatening but polite.' },
  { id: VoiceName.Celeb_Hugh, name: 'Wolverine', gender: 'Male', style: 'Gravelly', description: 'Deep, growling, angry mutant.' },
  { id: VoiceName.Celeb_Liam, name: 'Taken', gender: 'Male', style: 'Threatening', description: 'Very calm, very deep, very dangerous.' },
  { id: VoiceName.Celeb_Vin, name: 'Family Man', gender: 'Male', style: 'Deep Bass', description: 'Incredibly deep, slow, rumble.' },
  { id: VoiceName.Celeb_Jason, name: 'Transporter', gender: 'Male', style: 'Rough & British', description: 'Gruff, cockney-adjacent, tough guy.' },
  { id: VoiceName.Celeb_ChrisH, name: 'God of Thunder', gender: 'Male', style: 'Booming', description: 'Strong, loud, Asgardian royalty.' },
  { id: VoiceName.Celeb_ChrisE, name: 'Captain', gender: 'Male', style: 'Righteous', description: 'Honest, commanding, leader voice.' },

  // --- CELEBRITIES: Hollywood (Female) ---
  { id: VoiceName.Celeb_ScarJo, name: 'Black Widow', gender: 'Female', style: 'Raspy & Smooth', description: 'Deep, slightly raspy, attractive female tone.' },
  { id: VoiceName.Celeb_Marilyn, name: 'Bombshell', gender: 'Female', style: 'Breathy', description: 'Iconic breathy, high-pitched classic Hollywood.' },
  { id: VoiceName.Celeb_Angelina, name: 'Maleficent', gender: 'Female', style: 'Elegant & Dark', description: 'Sophisticated, British-leaning, powerful.' },
  { id: VoiceName.Celeb_JLaw, name: 'Katniss', gender: 'Female', style: 'Relatable', description: 'Down to earth, slightly deep, husky.' },
  { id: VoiceName.Celeb_Meryl, name: 'The Devil Wears', gender: 'Female', style: 'Icy', description: 'Soft spoken but terrifyingly authoritative.' },
  { id: VoiceName.Celeb_Gal, name: 'Wonder Woman', gender: 'Female', style: 'Exotic & Strong', description: 'Accent, strong, compassionate.' },
  { id: VoiceName.Celeb_Margot, name: 'Harley', gender: 'Female', style: 'Crazy', description: 'High pitched, Brooklyn accent, erratic.' },
  { id: VoiceName.Celeb_Emma, name: 'Hermione', gender: 'Female', style: 'Articulate', description: 'British, smart, precise, lecture-style.' },
  { id: VoiceName.Celeb_Zendaya, name: 'Gen Z Icon', gender: 'Female', style: 'Chill', description: 'Relaxed, modern, cool vocal fry.' },

  // --- CELEBRITIES: Musicians ---
  { id: VoiceName.Celeb_Eminem, name: 'Rap God', gender: 'Male', style: 'Rapid Fire', description: 'Fast, aggressive, nasal, rhythmic.' },
  { id: VoiceName.Celeb_Kanye, name: 'Ye', gender: 'Male', style: 'Confident', description: 'Bold, erratic, and deeply confident.' },
  { id: VoiceName.Celeb_Drake, name: 'Champagne Papi', gender: 'Male', style: 'Smooth', description: 'Monotone, melodic, relaxed.' },
  { id: VoiceName.Celeb_Snoop, name: 'Doggfather', gender: 'Male', style: 'Laid back', description: 'Extremely slow, chill, west coast drawl.' },
  { id: VoiceName.Celeb_JayZ, name: 'Hova', gender: 'Male', style: 'Business', description: 'Confident, slow, articulate, New York.' },
  { id: VoiceName.Celeb_Taylor, name: 'Pop Icon', gender: 'Female', style: 'Sweet & Melodic', description: 'Clear, friendly, and very relatable.' },
  { id: VoiceName.Celeb_Beyonce, name: 'Queen B', gender: 'Female', style: 'Powerful', description: 'Resonant, commanding, diva quality.' },
  { id: VoiceName.Celeb_Rihanna, name: 'Bad Gal', gender: 'Female', style: 'Island Cool', description: 'Distinct attitude, slight accent, cool.' },
  { id: VoiceName.Celeb_Billie, name: 'Whisper Pop', gender: 'Female', style: 'Soft & Moody', description: 'Quiet, vocal fry, cool and detached.' },
  { id: VoiceName.Celeb_Adele, name: 'London Soul', gender: 'Female', style: 'Thick Cockney', description: 'Deep, loud, soulful, heavy accent.' },
  { id: VoiceName.Celeb_Ariana, name: 'High Note', gender: 'Female', style: 'Sweet', description: 'High pitched, airy, fast.' },
  { id: VoiceName.Celeb_JustinB, name: 'Pop Prince', gender: 'Male', style: 'Soft', description: 'Breathy, melodic, young male pop star.' },
  { id: VoiceName.Celeb_Ed, name: 'Acoustic', gender: 'Male', style: 'British Folk', description: 'Soft British accent, friendly.' },
  { id: VoiceName.Celeb_Bruno, name: 'Funk Star', gender: 'Male', style: 'Bright', description: 'Tenor, energetic, bright tone.' },
  { id: VoiceName.Celeb_Weeknd, name: 'Starboy', gender: 'Male', style: 'Falsetto', description: 'Soft, high, dark R&B vibe.' },

  // --- CELEBRITIES: Tech & Business ---
  { id: VoiceName.Celeb_Elon, name: 'Space Visionary', gender: 'Male', style: 'Stuttery & Deep', description: 'Thoughtful, pausing often, tech billionaire vibe.' },
  { id: VoiceName.Celeb_Zuck, name: 'Metaverse', gender: 'Male', style: 'Robotic', description: 'Monotone, flat, very polite.' },
  { id: VoiceName.Celeb_Jobs, name: 'The Innovator', gender: 'Male', style: 'Visionary', description: 'Slow, captivating, presentation style.' },
  { id: VoiceName.Celeb_Gates, name: 'Micro Soft', gender: 'Male', style: 'Intellectual', description: 'Nasally, fast-paced, nerdy.' },
  { id: VoiceName.Celeb_Bezos, name: 'Prime', gender: 'Male', style: 'Laughing', description: 'Loud, distinct laugh, energetic.' },

  // --- CELEBRITIES: Icons & Historical ---
  { id: VoiceName.Celeb_Obama, name: '44th President', gender: 'Male', style: 'Orator', description: 'Rhythmic, pausing, melodic, presidential.' },
  { id: VoiceName.Celeb_Trump, name: 'The Don', gender: 'Male', style: 'Distinctive', description: 'Raspy, repetitive, confident New York.' },
  { id: VoiceName.Celeb_MLK, name: 'The Dream', gender: 'Male', style: 'Preacher', description: 'Booming, slow, powerful orator.' },
  { id: VoiceName.Celeb_JFK, name: 'Camelot', gender: 'Male', style: 'Boston', description: 'Fast, distinct Boston accent, charisma.' },
  { id: VoiceName.Celeb_Churchill, name: 'Wartime', gender: 'Male', style: 'Grumpy', description: 'Mumbly, deep, British, authoritative.' },
  { id: VoiceName.Celeb_Einstein, name: 'Genius', gender: 'Male', style: 'German', description: 'Soft, German accent, thoughtful.' },
  { id: VoiceName.Celeb_Gandhi, name: 'Mahatma', gender: 'Male', style: 'Soft Spoken', description: 'Very quiet, Indian accent, peaceful.' },
  { id: VoiceName.Celeb_Attenborough, name: 'Planet Earth', gender: 'Male', style: 'Whispered Awe', description: 'The definitive nature documentary voice.' },
  { id: VoiceName.Celeb_Gordon, name: 'Angry Chef', gender: 'Male', style: 'Aggressive', description: 'Shouting, critical, and extremely passionate.' },
  { id: VoiceName.Celeb_Oprah, name: 'Talk Show Queen', gender: 'Female', style: 'Enthusiastic', description: 'Loud, projecting, welcoming.' },
  { id: VoiceName.Celeb_Ellen, name: 'Daytime', gender: 'Female', style: 'Casual', description: 'Light, friendly, conversational.' },

  // --- Fictional Characters ---
  { id: VoiceName.Char_Batman, name: 'Dark Knight', gender: 'Male', style: 'Gravelly Whisper', description: 'Extremely deep, raspy, threatening whisper.' },
  { id: VoiceName.Char_Joker, name: 'Clown Prince', gender: 'Male', style: 'Manic', description: 'High pitched, laughing, terrifying.' },
  { id: VoiceName.Char_Vader, name: 'Sith Lord', gender: 'Male', style: 'Breathing', description: 'Deepest possible voice, mechanical breathing.' },
  { id: VoiceName.Char_Yoda, name: 'Jedi Master', gender: 'Male', style: 'Croaky', description: 'Strange syntax, croaky, old.' },
  { id: VoiceName.Char_Gollum, name: 'Precious', gender: 'Male', style: 'Choked', description: 'Throat-shredding, raspy, switching personalities.' },
  { id: VoiceName.Char_Bond, name: '007', gender: 'Male', style: 'Suave', description: 'British, calm, dangerous, seductive.' },
  { id: VoiceName.Char_Stark, name: 'Iron Suit', gender: 'Male', style: 'Filtered', description: 'Jarvis/Iron Man helmet effect.' },
  { id: VoiceName.Char_Optimus, name: 'Prime Leader', gender: 'Robot', style: 'Booming', description: 'Huge, metallic, noble leader.' },
  { id: VoiceName.Char_Sherlock, name: 'Detective', gender: 'Male', style: 'Rapid Deduction', description: 'Extremely fast, arrogant, British.' },
  { id: VoiceName.Char_Potter, name: 'Boy Wizard', gender: 'Male', style: 'British Youth', description: 'Young, brave, British accent.' },

  // --- Storytelling ---
  { id: VoiceName.Narrator_Deep, name: 'Epic Narrator', gender: 'Male', style: 'Deep & Authoritative', description: 'Perfect for epic stories and serious narration.' },
  { id: VoiceName.Movie_Trailer, name: 'Blockbuster', gender: 'Male', style: 'Gravelly & Booming', description: 'The classic "In a world..." movie trailer voice.' },
  { id: VoiceName.Storyteller_Fantasy, name: 'Fantasy Bard', gender: 'Male', style: 'Whimsical', description: 'Theatrical tone suited for fantasy novels.' },
  { id: VoiceName.Audiobook_Classic, name: 'Classic Literature', gender: 'Female', style: 'Articulate', description: 'Proper, well-paced reading for novels.' },
  { id: VoiceName.Documentary_Nature, name: 'Nature Doc', gender: 'Male', style: 'Observational', description: 'Quiet, intense, observational.' },

  // --- Professional ---
  { id: VoiceName.News_Anchor_Male, name: 'News Anchor (M)', gender: 'Male', style: 'Professional', description: 'Clear, neutral, and authoritative news delivery.' },
  { id: VoiceName.News_Anchor_Female, name: 'News Anchor (F)', gender: 'Female', style: 'Professional', description: 'Sharp, clear, and broadcast-ready.' },
  { id: VoiceName.Motivational_Speaker, name: 'Motivator', gender: 'Male', style: 'High Energy', description: 'Inspiring, punchy, and driving speech.' },

  // --- Emotions ---
  { id: VoiceName.Emotion_Happy, name: 'Joyful', gender: 'Female', style: 'Cheerful', description: 'Full of laughter and bright energy.' },
  { id: VoiceName.Emotion_Sad, name: 'Melancholy', gender: 'Male', style: 'Sorrowful', description: 'Quiet, slow, and heavy with emotion.' },
  { id: VoiceName.Emotion_Angry, name: 'Furious', gender: 'Male', style: 'Aggressive', description: 'Loud, fast, and intensely angry.' },
  { id: VoiceName.Emotion_Whisper, name: 'Secret Whisper', gender: 'Female', style: 'Whispering', description: 'Very quiet, close-to-mic ASMR style.' },

  // --- Accents ---
  { id: VoiceName.Accent_Indian_Male, name: 'Indian (M)', gender: 'Male', style: 'Regional', description: 'Clear English with a distinct Indian accent.' },
  { id: VoiceName.Accent_British_Posh, name: 'British Royal', gender: 'Male', style: 'Sophisticated', description: 'Upper-class "Queen\'s English" accent.' },
  { id: VoiceName.Accent_American_Southern, name: 'Southern Cowboy', gender: 'Male', style: 'Drawl', description: 'Slow, deep, twangy Southern cowboy drawl.' },
  { id: VoiceName.Accent_Australian, name: 'Aussie', gender: 'Male', style: 'Casual', description: 'Laid-back, casual Australian accent.' },
  { id: VoiceName.Accent_Russian, name: 'Russian Spy', gender: 'Male', style: 'Heavy', description: 'Thick, intimidating Russian accent.' },
];

export const SAMPLE_TEXTS = {
  English: "The future belongs to those who believe in the beauty of their dreams.",
  Tamil: "வாழ்க்கை என்பது ஒரு வட்டம். அதில் ஜெயிக்கிறவன் தோற்பான், தோற்கிறவன் ஜெயிப்பான்!"
};