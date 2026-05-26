import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';

interface Emoticon {
  id: string;
  emoji: string;
  label: string;
  animClass: string;
}

const EMOTICONS: Emoticon[] = [
  { id: 'happy',    emoji: '😊', label: 'Feliz',          animClass: 'anim-pulse'     },
  { id: 'love',     emoji: '❤️', label: 'Apaixonado',     animClass: 'anim-heartbeat' },
  { id: 'sad',      emoji: '😢', label: 'Triste',         animClass: 'anim-bounce'    },
  { id: 'cool',     emoji: '😎', label: 'Estiloso',       animClass: 'anim-pulse'     },
  { id: 'laugh',    emoji: '😂', label: 'Rindo',          animClass: 'anim-bounce'    },
  { id: 'music',    emoji: '🎵', label: 'Ouvindo música', animClass: 'anim-spin'      },
  { id: 'gaming',   emoji: '🎮', label: 'Jogando',        animClass: 'anim-pulse'     },
  { id: 'coffee',   emoji: '☕', label: 'Tomando café',   animClass: 'anim-bounce'    },
  { id: 'busy',     emoji: '😤', label: 'Ocupado',        animClass: 'anim-pulse'     },
  { id: 'sleepy',   emoji: '😴', label: 'Com sono',       animClass: 'anim-float'     },
  { id: 'phone',    emoji: '📞', label: 'No telefone',    animClass: 'anim-ring'      },
  { id: 'away',     emoji: '🌙', label: 'Ausente',        animClass: 'anim-float'     },
  { id: 'work',     emoji: '💻', label: 'Trabalhando',    animClass: 'anim-pulse'     },
  { id: 'eating',   emoji: '🍕', label: 'Comendo',        animClass: 'anim-bounce'    },
  { id: 'working',  emoji: '✏️', label: 'Estudando',      animClass: 'anim-pulse'     },
  { id: 'star',     emoji: '⭐', label: 'Em destaque',    animClass: 'anim-spin'      },
  { id: 'fire',     emoji: '🔥', label: 'Empolgado',      animClass: 'anim-heartbeat' },
  { id: 'none',     emoji: '•',  label: 'Nenhum',         animClass: ''               },
];

export const StatusEditor: React.FC = () => {
  const { currentUser, updateUserStatus } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(currentUser.statusMessage);
  const [selectedEmoji, setSelectedEmoji] = useState(currentUser.statusEmoticon);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sync when user data loads from Supabase
  useEffect(() => {
    setDraft(currentUser.statusMessage);
    setSelectedEmoji(currentUser.statusEmoticon);
  }, [currentUser.statusMessage, currentUser.statusEmoticon]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleOpen = () => {
    setDraft(currentUser.statusMessage);
    setSelectedEmoji(currentUser.statusEmoticon);
    setIsOpen(true);
  };

  const handleSave = () => {
    updateUserStatus(draft.trim() || 'Disponível', selectedEmoji);
    setIsOpen(false);
  };

  const currentEmoticon = EMOTICONS.find(e => e.emoji === currentUser.statusEmoticon);
  const selectedEmoticon = EMOTICONS.find(e => e.emoji === selectedEmoji);

  return (
    <>
      {/* Trigger button — shows current status */}
      <button
        id="status-editor-btn"
        onClick={handleOpen}
        className="flex items-center gap-1 max-w-[160px] group"
        title="Clique para editar seu status"
      >
        {currentEmoticon && currentEmoticon.id !== 'none' && (
          <span className={`text-[11px] inline-block leading-none ${currentEmoticon.animClass}`} style={{ display: 'inline-block' }}>
            {currentUser.statusEmoticon}
          </span>
        )}
        <span className="text-[9px] text-[#3E5C76] group-hover:text-[#091F41] truncate leading-tight text-left transition-colors">
          {currentUser.statusMessage || 'Clique para definir status'}
        </span>
      </button>

      {/* Fixed centered modal — works on any screen size */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[#F0F6FA] border border-[#8BADC4] shadow-2xl rounded-sm w-full max-w-[300px]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] px-3 py-1.5 flex items-center justify-between border-b border-[#8BADC4]">
              <span className="text-[11px] font-bold text-[#091F41]">✏️ Minha Mensagem Pessoal</span>
              <button onClick={() => setIsOpen(false)} className="text-[#3E5C76] hover:text-black text-sm w-5 h-5 flex items-center justify-center">×</button>
            </div>

            <div className="p-3 flex flex-col gap-3">
              {/* Text input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#3E5C76] font-bold uppercase tracking-wide">Mensagem de Status</label>
                <input
                  id="status-text-input"
                  autoFocus
                  type="text"
                  maxLength={60}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="O que você está fazendo?"
                  className="w-full border border-[#8BADC4] bg-white px-2 py-1.5 text-[13px] font-['Tahoma'] outline-none focus:border-[#4A90D9] shadow-inner rounded-sm"
                />
                <span className="text-[9px] text-[#999] self-end">{draft.length}/60</span>
              </div>

              {/* Emoticon picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#3E5C76] font-bold uppercase tracking-wide">Emoticon Animado</label>
                <div className="grid grid-cols-9 gap-0.5 bg-white border border-[#8BADC4] p-1.5 shadow-inner rounded-sm max-h-[90px] overflow-y-auto">
                  {EMOTICONS.map(emote => (
                    <button
                      key={emote.id}
                      id={`emote-btn-${emote.id}`}
                      onClick={() => setSelectedEmoji(emote.emoji)}
                      onMouseEnter={() => setHoveredId(emote.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      title={emote.label}
                      className={`w-7 h-7 flex items-center justify-center rounded-sm transition-all ${
                        selectedEmoji === emote.emoji
                          ? 'bg-[#C4DEFF] border border-[#4A90D9]'
                          : 'hover:bg-[#DFF0FB] border border-transparent'
                      }`}
                    >
                      <span
                        className={`inline-block leading-none ${
                          hoveredId === emote.id || selectedEmoji === emote.emoji ? emote.animClass : ''
                        }`}
                        style={{ display: 'inline-block', fontSize: '14px' }}
                      >
                        {emote.emoji}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Preview */}
                <div className="flex items-center gap-2 text-[10px] text-[#3E5C76] bg-[#EAF2F8] border border-[#C8DAEA] px-2 py-1.5 rounded-sm">
                  <span className="font-bold">Prévia:</span>
                  {selectedEmoticon && selectedEmoticon.id !== 'none' && (
                    <span className={`inline-block ${selectedEmoticon.animClass}`} style={{ display: 'inline-block', fontSize: '13px' }}>
                      {selectedEmoji}
                    </span>
                  )}
                  <span className="truncate italic text-[#555]">{draft || 'Disponível'}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 border-t border-[#C8DAEA] pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 text-[12px] font-['Tahoma'] bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] border border-[#8BADC4] hover:from-[#E8F2F9] rounded-sm shadow-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="status-save-btn"
                  onClick={handleSave}
                  className="flex-1 py-2 text-[12px] font-['Tahoma'] bg-gradient-to-b from-[#6CAADC] to-[#3A80C0] text-white border border-[#2A6099] hover:from-[#7BBDE8] rounded-sm shadow-sm font-bold transition-all"
                >
                  ✓ OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
