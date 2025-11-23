import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AVAILABLE_VOICES, SAMPLE_TEXTS } from './constants';
import { VoiceName, SupportedLanguage, HistoryItem } from './types';
import { generateSpeech, refineTextWithAI, translateText, hasApiKey, reloadKeys } from './services/geminiService';
import { bufferToWav, audioBufferToBlob } from './services/audioUtils';
import VoiceSelector from './components/VoiceSelector';
import Visualizer from './components/Visualizer';

// Initialize Audio Context lazily to handle browser autoplay policies
const getAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
};

export default function App() {
  const [text, setText] = useState<string>(SAMPLE_TEXTS.English);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Base_Kore);
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [speed, setSpeed] = useState<number>(1.0);
  const [highQuality, setHighQuality] = useState<boolean>(true); // "Best Audio" vs "Fast"
  const [downloadFormat, setDownloadFormat] = useState<'wav' | 'mp4'>('wav');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentBuffer, setCurrentBuffer] = useState<AudioBuffer | null>(null);

  // Backup Keys State
  const [backupKeysInput, setBackupKeysInput] = useState('');

  // Audio References
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Check API Key on mount
  useEffect(() => {
    if (!hasApiKey()) {
      setIsConfigError(true);
    }
  }, []);

  // Initialize Audio Context
  useEffect(() => {
    try {
      audioContextRef.current = getAudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      setAnalyser(analyserRef.current);
    } catch (e) {
      console.error("Failed to initialize audio context", e);
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Real-time speed adjustment during playback
  useEffect(() => {
    if (sourceNodeRef.current && isPlaying) {
      sourceNodeRef.current.playbackRate.value = speed;
    }
  }, [speed, isPlaying]);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang === language) return;
    setLanguage(lang);

    const currentText = text.trim();
    // If text is sample text or empty, just switch sample
    if (
      !currentText || 
      currentText === SAMPLE_TEXTS.English || 
      currentText === SAMPLE_TEXTS.Tamil
    ) {
      setText(SAMPLE_TEXTS[lang]);
      return;
    }

    // Otherwise translate existing text
    setIsTranslating(true);
    try {
      const translated = await translateText(currentText, lang);
      setText(translated);
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
         setIsConfigError(true);
         setError("API Key Missing");
      } else {
         console.error("Translation error:", e);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRefineText = async () => {
    if (!text.trim()) return;
    setIsRefining(true);
    setError(null);
    try {
      const refined = await refineTextWithAI(text, selectedVoice);
      setText(refined);
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        setIsConfigError(true);
        setError("API Key Missing");
      } else {
        console.error(e);
        setError("Failed to enhance text. " + (e.message || ""));
      }
    } finally {
      setIsRefining(false);
    }
  };

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback((buffer: AudioBuffer) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    stopAudio();

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;
    
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    source.onended = () => {
      setIsPlaying(false);
    };

    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  }, [speed, stopAudio]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text.");
      return;
    }

    if (!hasApiKey()) {
      setIsConfigError(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsConfigError(false);
    setShowQuotaModal(false);
    stopAudio();
    setCurrentBuffer(null);

    // 1. CACHE CHECK: Check history for identical request to save quota
    const cachedItem = history.find(item => 
      item.text === text && 
      item.voice === selectedVoice && 
      item.language === language &&
      item.audioBuffer !== null &&
      // Check if speed is effectively the same (tolerance for float)
      Math.abs(item.speed - speed) < 0.1 
    );

    if (cachedItem && cachedItem.audioBuffer) {
      console.log("Using cached audio - 0 Quota used");
      setCurrentBuffer(cachedItem.audioBuffer);
      // Move to top of history
      setHistory(prev => [
        cachedItem, 
        ...prev.filter(i => i.id !== cachedItem.id)
      ]);
      playAudio(cachedItem.audioBuffer);
      setIsLoading(false);
      return;
    }

    // 2. API REQUEST
    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (!audioContextRef.current) throw new Error("Audio Context not ready");

      const audioBuffer = await generateSpeech(
        text,
        selectedVoice,
        language,
        audioContextRef.current,
        speed,
        highQuality
      );

      setCurrentBuffer(audioBuffer);

      // Add to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        text: text,
        language: language,
        voice: selectedVoice,
        speed: speed,
        timestamp: Date.now(),
        audioBuffer: audioBuffer,
      };

      setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
      playAudio(audioBuffer);

    } catch (err: any) {
      console.error("Generation failed:", err);
      
      let errorMessage = err.message || "An unexpected error occurred.";
      
      // Attempt to parse JSON error message if it comes in raw format
      if (typeof errorMessage === 'string' && (errorMessage.startsWith('{') || errorMessage.includes('error'))) {
        try {
            const parsed = JSON.parse(errorMessage);
            if (parsed.error && parsed.error.message) {
                errorMessage = parsed.error.message;
            } else if (parsed.message) {
                errorMessage = parsed.message;
            }
        } catch (e) {
            // parsing failed, use original string
        }
      }

      // Handle Rate Limits (429) & Quota Exhaustion
      if (
        errorMessage.includes("RESOURCE_EXHAUSTED") || 
        errorMessage.includes("Quota exceeded") || 
        errorMessage.includes("429") ||
        errorMessage.includes("exhausted")
      ) {
         setShowQuotaModal(true); // Show the upgrade modal
      } else if (errorMessage === "API_KEY_MISSING") {
        setIsConfigError(true);
        setError("Missing API Key. Configuration Required.");
      } else if (errorMessage.includes("API Key") || errorMessage.includes("403")) {
        setIsConfigError(true);
        setError("Invalid API Key. Please check your quota or key settings.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryPlay = (item: HistoryItem) => {
    if (item.audioBuffer) {
      setText(item.text);
      setLanguage(item.language as SupportedLanguage);
      setSelectedVoice(item.voice);
      setSpeed(item.speed);
      setCurrentBuffer(item.audioBuffer);
      playAudio(item.audioBuffer);
    }
  };

  const handleDownload = async (buffer: AudioBuffer, filename: string) => {
    try {
      let blob: Blob;
      let extension = downloadFormat;

      if (downloadFormat === 'wav') {
        blob = bufferToWav(buffer);
      } else {
        // MP4 / MP3 (Compressed)
        blob = await audioBufferToBlob(buffer, 'mp4');
        if (blob.type.includes('webm')) {
            extension = 'mp4'; 
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      setError("Failed to create download file");
    }
  };

  const saveBackupKeys = () => {
    if (backupKeysInput.trim()) {
      localStorage.setItem('voicefy_backup_keys', backupKeysInput.trim());
      reloadKeys(); // Reload the service
      setShowQuotaModal(false);
      setBackupKeysInput('');
      // Retry generation automatically? No, let user click.
      alert("Backup keys saved! You can try generating again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* Dynamic Colorful Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
         <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[120px]" style={{ animationDelay: '2s' }}></div>
         <div className="absolute top-[30%] right-[20%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
         <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px]" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Quota Exhaustion / Unlimited Mode Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1b26] border border-pink-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-in">
             <button onClick={() => setShowQuotaModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <div className="text-center mb-6">
               <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/30">
                 <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <h2 className="text-xl font-bold text-white mb-2">Unlock Unlimited Generations</h2>
               <p className="text-sm text-gray-300">
                 You have hit the Gemini Free Tier limit. You can bypass this by adding backup keys or upgrading.
               </p>
             </div>
             
             <div className="space-y-4">
               {/* Option 1: Add Keys */}
               <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                 <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Add Backup Keys (Free Method)</label>
                 <textarea 
                   value={backupKeysInput}
                   onChange={(e) => setBackupKeysInput(e.target.value)}
                   placeholder="Paste keys here separated by commas (e.g., AIza..., AIza...)"
                   className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:border-indigo-500 outline-none h-20 mb-3"
                 />
                 <button 
                   onClick={saveBackupKeys}
                   disabled={!backupKeysInput.trim()}
                   className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                 >
                   Save Keys & Continue
                 </button>
                 <p className="text-[10px] text-gray-500 mt-2 text-center">
                   Keys are stored locally in your browser and used to rotate quota.
                 </p>
               </div>

               {/* Option 2: Pay */}
               <div className="text-center">
                 <p className="text-xs text-gray-400 mb-2">OR</p>
                 <a 
                   href="https://aistudio.google.com/app/billing" 
                   target="_blank" 
                   rel="noreferrer"
                   className="block w-full py-3 bg-white text-black font-bold text-center rounded-xl hover:bg-gray-200 transition-colors shadow-lg text-sm"
                 >
                   Upgrade to Pay-As-You-Go
                 </a>
               </div>
             </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* MAIN PANEL */}
        <div className="lg:col-span-8 space-y-4 animate-slide-up stagger-1">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-white/5 gap-4 sm:gap-0">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                     Voicefy 
                     <span className="text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-sm">ULTRA</span>
                   </h1>
                   <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <span>Created by M.Sanjiv</span>
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                   </div>
                </div>
             </div>
             
             {/* Quality Toggle */}
             <div className="flex items-center space-x-2 bg-black/40 px-1 py-1 rounded-lg border border-white/5">
                <button 
                  onClick={() => setHighQuality(false)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-all ${!highQuality ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Turbo
                </button>
                <button 
                  onClick={() => setHighQuality(true)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 ${highQuality ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/30' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <span>High Fidelity</span>
                  {highQuality && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse ml-1"></span>}
                </button>
             </div>
          </div>

          {/* Configuration Error Message */}
          {isConfigError && (
            <div className="bg-red-900/40 border border-red-500 rounded-2xl p-6 animate-scale-in shadow-2xl">
               <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                     <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white mb-2">Setup Required: Missing API Key</h3>
                     <p className="text-sm text-gray-300 mb-4">
                        To use this app, you need to provide a Google Gemini API Key. 
                        The app cannot function without it.
                     </p>
                     <div className="bg-black/40 rounded-lg p-4 text-xs font-mono text-gray-400 border border-white/5">
                        <p className="mb-2 font-bold text-white">How to fix it:</p>
                        <ol className="list-decimal ml-4 space-y-2">
                           <li>Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.</li>
                           <li>
                              <span className="text-yellow-400">Running Locally?</span> Create a <code className="bg-white/10 px-1 rounded">.env</code> file in the root folder and add:
                              <br/><span className="text-green-400">API_KEY=your_key_here</span>
                           </li>
                           <li>
                              <span className="text-pink-400">Deployed on Vercel?</span> Go to Project Settings → Environment Variables and add <code className="bg-white/10 px-1 rounded">API_KEY</code>.
                           </li>
                        </ol>
                     </div>
                     <button onClick={() => setIsConfigError(false)} className="mt-4 text-sm text-white/60 hover:text-white underline">Dismiss</button>
                  </div>
               </div>
            </div>
          )}

          {/* General Error Display */}
          {error && !isConfigError && (
             <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3 animate-fade-in shadow-lg shadow-red-900/10">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div className="text-sm text-red-100">
                   <span className="font-bold block mb-1">Error</span>
                   {error}
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-auto p-1 bg-red-500/10 rounded-md hover:bg-red-500/30">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
          )}

          {/* Editor Card */}
          <div className="bg-[#131316]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl relative group">
            
            {/* Toolbar */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-white/[0.02] rounded-t-[22px]">
               <div className="flex space-x-1 bg-black/20 p-1 rounded-lg">
                  <button onClick={() => handleLanguageChange('English')} className={`text-xs px-4 py-2 rounded-md font-medium transition-all duration-300 ${language === 'English' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-gray-200'}`}>English</button>
                  <button 
                    onClick={() => handleLanguageChange('Tamil')} 
                    className={`text-xs px-4 py-2 rounded-md font-medium transition-all duration-300 flex items-center gap-2 ${language === 'Tamil' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    Tamil
                    {isTranslating && <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  </button>
               </div>
               
               <button 
                  onClick={handleRefineText}
                  disabled={isRefining || !text}
                  className="flex items-center space-x-1.5 text-xs font-medium text-indigo-200 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-all duration-300"
               >
                  {isRefining ? (
                     <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  <span>{isRefining ? 'Enhancing...' : 'Magic Enhance'}</span>
               </button>
            </div>

            {/* Text Area */}
            <div className="relative group/textarea">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isTranslating ? "Translating text..." : "Enter text to synthesize..."}
                disabled={isTranslating}
                className="w-full h-48 bg-transparent text-gray-100 p-6 text-lg leading-relaxed focus:outline-none resize-none font-light placeholder-gray-600"
                spellCheck={false}
              />
              <div className="absolute bottom-3 right-4 text-[10px] text-gray-500 font-mono bg-black/30 px-2 py-1 rounded border border-white/5 backdrop-blur-md">
                {text.length} chars
              </div>
              {/* Subtle focus glow */}
              <div className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-500 opacity-0 group-focus-within/textarea:opacity-100 shadow-[inset_0_0_50px_rgba(99,102,241,0.05)]"></div>
            </div>

            {/* Voice Grid Section */}
            <div className="bg-[#0e0e11]/50 border-t border-white/5 p-4 rounded-b-[22px]">
               <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                    Select Persona ({AVAILABLE_VOICES.length})
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
               </div>
               <VoiceSelector 
                  selectedVoice={selectedVoice} 
                  onSelect={setSelectedVoice} 
                  disabled={isLoading || isPlaying}
               />
            </div>
          </div>
          
          {/* Controls Bar */}
          <div className="bg-[#131316]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
             
             {/* Visualizer */}
             <div className="flex-1 w-full md:w-auto h-20 bg-black/40 rounded-xl overflow-hidden border border-white/5 relative shadow-inner">
                <Visualizer analyser={analyser} isPlaying={isPlaying} />
             </div>

             {/* Right Controls */}
             <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                
                {/* Speed Dial */}
                <div className="flex items-center gap-2 bg-black/30 px-3 py-3 rounded-xl border border-white/5 backdrop-blur-sm">
                   <span className="text-[10px] text-gray-400 uppercase font-bold">SPD</span>
                   <input 
                      type="range" min="0.5" max="2.0" step="0.1"
                      value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                   />
                   <span className="text-xs font-mono text-pink-300 w-8 text-right">{speed}x</span>
                </div>

                {/* Download Group */}
                {currentBuffer && !isLoading && (
                  <div className="flex items-center bg-white/10 rounded-xl border border-white/10">
                    <select 
                      value={downloadFormat}
                      onChange={(e) => setDownloadFormat(e.target.value as 'wav' | 'mp4')}
                      className="bg-transparent text-xs text-gray-300 font-bold px-3 py-3 outline-none cursor-pointer hover:text-white"
                    >
                      <option value="wav" className="bg-slate-900 text-white">WAV</option>
                      <option value="mp4" className="bg-slate-900 text-white">MP4</option>
                    </select>
                    <button 
                      onClick={() => handleDownload(currentBuffer, `Vocalize_${Date.now()}`)}
                      className="h-full px-3 py-3 hover:bg-white/10 rounded-r-xl transition-all text-gray-300 hover:text-white border-l border-white/10"
                      title={`Download Audio (${downloadFormat.toUpperCase()})`}
                    >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                )}

                {/* Main Action Button - HIGH VISIBILITY */}
                {isPlaying ? (
                   <button 
                     onClick={stopAudio}
                     className="bg-red-500 hover:bg-red-600 text-white h-14 px-8 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 min-w-[140px] justify-center"
                   >
                     <div className="w-3 h-3 bg-white rounded-sm animate-pulse"></div>
                     STOP
                   </button>
                ) : (
                   <button
                     onClick={handleGenerate}
                     disabled={isLoading || !text}
                     className={`
                       h-14 px-10 rounded-xl font-bold text-white transition-all duration-300 flex items-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.4)] relative overflow-hidden group min-w-[180px] justify-center
                       ${isLoading ? 'bg-gray-800 opacity-80 cursor-wait' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 scale-100 hover:scale-105'}
                     `}
                   >
                      {/* Shimmer effect */}
                      {!isLoading && <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent z-10"></div>}
                      
                      {isLoading ? (
                         <>
                           <svg className="animate-spin h-5 w-5 text-indigo-200" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           <span className="text-indigo-100 tracking-wide">PROCESSING...</span>
                         </>
                      ) : (
                         <>
                           <span className="relative z-20 tracking-wider text-lg">SYNTHESIZE</span>
                           <svg className="w-5 h-5 relative z-20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                         </>
                      )}
                   </button>
                )}
             </div>
          </div>
        </div>

        {/* RIGHT PANEL - History */}
        <div className="lg:col-span-4 h-full animate-slide-up stagger-2">
           <div className="bg-[#131316]/80 backdrop-blur-xl border border-white/10 rounded-3xl h-[calc(100vh-100px)] p-5 flex flex-col shadow-2xl">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 px-1 flex items-center gap-2">
                <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Recent Generations
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.map((item) => (
                   <div 
                     key={item.id}
                     className="group bg-black/40 hover:bg-white/10 border border-white/5 hover:border-pink-500/30 p-4 rounded-xl transition-all duration-300 hover:translate-x-1 relative"
                   >
                      <div className="cursor-pointer" onClick={() => handleHistoryPlay(item)}>
                        <div className="flex justify-between items-start mb-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${item.language === 'Tamil' ? 'bg-pink-500/20 text-pink-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                             {item.voice.includes('Celeb') ? 'Celebrity' : (item.voice.split('_')[1] || 'Default')}
                           </span>
                           <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                          {item.text}
                        </p>
                      </div>

                      {/* Download Button on Hover */}
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           if (item.audioBuffer) handleDownload(item.audioBuffer, `Voicefy_${item.id}`);
                         }}
                         className="absolute bottom-4 right-4 p-2 bg-indigo-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-500 shadow-lg"
                         title="Download"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                   </div>
                ))}
                {history.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                      </div>
                      <span className="text-sm font-medium">No audio generated yet</span>
                   </div>
                )}
              </div>
           </div>
        </div>

        {/* Creator Tag */}
        <div className="absolute top-0 right-0 p-4 hidden lg:block">
           <div className="text-[10px] text-gray-500 font-mono bg-black/20 px-3 py-1 rounded-full border border-white/5 hover:border-white/10 transition-colors">
              Created by M.Sanjiv
           </div>
        </div>

      </div>
    </div>
  );
}
