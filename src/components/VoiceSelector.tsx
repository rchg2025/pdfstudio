import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import './VoiceSelector.css';

interface VoiceSelectorProps {
  voices: SpeechSynthesisVoice[];
  selectedVoiceIndex: number;
  onSelect: (index: number) => void;
}

const langToCountry: Record<string, string> = {
  'vi': 'VN', 'en': 'US', 'ja': 'JP', 'ko': 'KR', 'zh': 'CN', 
  'fr': 'FR', 'de': 'DE', 'es': 'ES', 'it': 'IT', 'ru': 'RU',
  'th': 'TH', 'id': 'ID', 'ms': 'MY', 'pt': 'PT', 'nl': 'NL'
};

const getFlagEmoji = (langCode: string) => {
  if (!langCode) return '🏳️';
  const parts = langCode.split(/[-_]/);
  let country = parts.length > 1 ? parts[1] : (langToCountry[parts[0].toLowerCase()] || parts[0]);
  
  // UK is a special case in ISO
  if (country.toUpperCase() === 'UK') country = 'GB';
  // English default to US if not specified
  if (langCode.toLowerCase() === 'en' || langCode.toLowerCase() === 'eng') country = 'US';

  if (country.length === 2) {
    const codePoints = country
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return '🏳️';
}

export default function VoiceSelector({ voices, selectedVoiceIndex, onSelect }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVoices = voices.map((voice, index) => ({ voice, index }))
    .filter(item => 
      item.voice.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.voice.lang.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const selectedVoice = voices[selectedVoiceIndex];

  return (
    <div className="voice-selector-container" ref={containerRef}>
      <button 
        className="voice-selector-button" 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          {selectedVoice ? (
            <>
              <span className="voice-flag">{getFlagEmoji(selectedVoice.lang)}</span>
              <span className="voice-name">
                {selectedVoice.name} ({selectedVoice.lang}) {selectedVoice.default ? ' - Mặc định' : ''}
              </span>
            </>
          ) : (
            'Đang tải giọng đọc...'
          )}
        </span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="voice-selector-dropdown">
          <div className="voice-selector-search">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm giọng đọc (VD: vi, en, Zira)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '28px' }}
                autoFocus
              />
            </div>
          </div>
          <div className="voice-selector-list">
            {filteredVoices.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Không tìm thấy giọng đọc nào
              </div>
            ) : (
              filteredVoices.map(({ voice, index }) => (
                <div 
                  key={voice.name}
                  className={`voice-selector-item ${index === selectedVoiceIndex ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(index);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <span className="voice-flag">{getFlagEmoji(voice.lang)}</span>
                  <span className="voice-name">
                    {voice.name} ({voice.lang}) {voice.default ? ' - Mặc định' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
