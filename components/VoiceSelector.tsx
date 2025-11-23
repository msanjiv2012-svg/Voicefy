import React, { useState } from 'react';
import { AVAILABLE_VOICES } from '../constants';
import { VoiceName } from '../types';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelect: (voice: VoiceName) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelect, disabled }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVoices = AVAILABLE_VOICES.filter(voice => 
    voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voice.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voice.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-[#15151a] pb-4 pt-1 mb-2">
        <div className="relative group">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search voices (e.g. 'Iron Man', 'News', 'Happy')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-gray-600 shadow-inner"
          />
        </div>
      </div>

      <div className="max-h-[350px] overflow-y-auto pr-2 mb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* Updated Grid for 50+ items: Mobile 1 col, Tablet 2 cols, Desktop 3 cols, Large Desktop 4 cols */}
        {filteredVoices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredVoices.map((voice, index) => (
              <button
                key={voice.id}
                onClick={() => onSelect(voice.id)}
                disabled={disabled}
                style={{ animationDelay: `${Math.min(index * 30, 900)}ms` }} // Cap delay so end items don't take forever
                className={`
                  relative overflow-hidden p-3 rounded-xl border text-left transition-all duration-300 group
                  animate-slide-up opacity-0
                  ${selectedVoice === voice.id 
                    ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 hover:shadow-lg'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-bold truncate pr-2 transition-colors ${selectedVoice === voice.id ? 'text-primary-300' : 'text-gray-200 group-hover:text-white'}`}>
                    {voice.name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${selectedVoice === voice.id ? 'bg-primary/30 border-primary/30 text-white' : 'bg-black/40 border-white/10 text-gray-400'}`}>
                    {voice.gender}
                  </span>
                </div>
                <div className={`text-[10px] font-medium mb-1 transition-colors uppercase tracking-wide ${selectedVoice === voice.id ? 'text-primary-200' : 'text-gray-400 group-hover:text-primary-300'}`}>
                  {voice.style}
                </div>
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight group-hover:text-gray-400 transition-colors">
                  {voice.description}
                </p>
                
                {/* Selection Highlight Glint */}
                {selectedVoice === voice.id && (
                  <div className="absolute top-0 right-0 w-full h-full pointer-events-none bg-gradient-to-l from-primary/10 via-transparent to-transparent"></div>
                )}
                
                {/* Hover Glint */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-sm">No voices found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSelector;