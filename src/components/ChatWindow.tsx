import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import type { Contact, Group } from '../store';
import { triggerNativeKnock, triggerNativeShake } from '../utils/haptics';
import { AudioRecorder } from './AudioRecorder';
import { StatusEditor } from './StatusEditor';

export const ChatWindow: React.FC<{ activeContact?: Contact; activeGroup?: Group; mobileMode?: boolean }> = ({ activeContact, activeGroup, mobileMode = false }) => {
  const [text, setText] = useState('');
  const [showSounds, setShowSounds] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgAlertRef = useRef<HTMLAudioElement | null>(null);
  const shakeAlertRef = useRef<HTMLAudioElement | null>(null);
  const nudgeAlertRef = useRef<HTMLAudioElement | null>(null);
  const { currentUser, messages, groupMessages, sendDatabaseMessage, sendGroupMessage, triggerShake, isGeminiTyping } = useAppStore();

  const currentMessages = activeGroup ? groupMessages : messages;

  // Preload MSN alert sound once
  useEffect(() => {
    msgAlertRef.current = new Audio('/sounds/msn-message.mp3');
    msgAlertRef.current.volume = 0.8;
    shakeAlertRef.current = new Audio('/sounds/msn-shake.mp3');
    shakeAlertRef.current.volume = 0.9;
    nudgeAlertRef.current = new Audio('/sounds/msn-nudge.mp3');
    nudgeAlertRef.current.volume = 0.85;
  }, []);

  const lastPlayedMsgIdRef = useRef<string | null>(null);
  const lastChatIdRef = useRef<string | undefined>(activeGroup?.id || activeContact?.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
    const currentChatId = activeGroup?.id || activeContact?.id;
    const len = currentMessages.length;

    // Se mudou de contato/grupo, apenas atualiza as referências e não toca o som
    if (lastChatIdRef.current !== currentChatId) {
      lastChatIdRef.current = currentChatId;
      lastPlayedMsgIdRef.current = len > 0 ? currentMessages[len - 1].id : null;
      return;
    }

    if (len > 0) {
      const last = currentMessages[len - 1];
      // Toca o som apenas se:
      // 1. Não fomos nós que enviamos
      // 2. Já tivermos uma msg registrada antes (não é o load inicial com msgs)
      // 3. O ID da msg é diferente do último que apitou
      if (
        last.senderId !== currentUser.id &&
        lastPlayedMsgIdRef.current !== null &&
        lastPlayedMsgIdRef.current !== last.id &&
        msgAlertRef.current
      ) {
        msgAlertRef.current.currentTime = 0;
        msgAlertRef.current.play().catch(() => {});
      }
      // Atualiza o ref da última msg para a atual
      lastPlayedMsgIdRef.current = last.id;
    }
  }, [currentMessages, currentUser.id, activeGroup?.id, activeContact?.id]);

  // Insert emoji at textarea cursor position
  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) { setText(t => t + emoji); return; }
    const start = ta.selectionStart ?? text.length;
    const end   = ta.selectionEnd   ?? text.length;
    const next  = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    setShowEmojis(false);
    // Restore focus + cursor after emoji
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (activeGroup) {
      sendGroupMessage('text', text);
    } else {
      sendDatabaseMessage('text', text);
    }
    setText('');
  };

  /*
  const handleNudge = () => {
    addMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      type: 'nudge',
      content: 'chamou sua atenção!',
    });
    triggerNativeNudge();

    // Play nudge sound
    const audio = nudgeAlertRef.current;
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }

    // Visual: flash the window border 3 times (no screen shake)
    const win = document.querySelector<HTMLElement>('.wizz-window');
    if (win) {
      let count = 0;
      const flash = setInterval(() => {
        win.style.boxShadow = count % 2 === 0
          ? '0 0 0 3px #FFD700, 0 0 18px 6px rgba(255,215,0,0.6)'
          : '0 0 0 1px #8BADC4';
        count++;
        if (count >= 6) {
          clearInterval(flash);
          win.style.boxShadow = '';
        }
      }, 120);
    }
  };
  */


  const handleShake = () => {
    if (activeGroup) {
      sendGroupMessage('shake', 'chamou a atenção do grupo! 😲');
    } else {
      sendDatabaseMessage('shake', 'chamou sua atenção! 😲');
    }
    triggerShake();
    triggerNativeShake();

    // Full-screen flash overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:200',
      'pointer-events:none',
      'background:rgba(255,255,0,0.18)',
      'transition:opacity 0.15s',
    ].join(';');
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '0'; }, 200);
    setTimeout(() => overlay.remove(), 400);

    const audio = shakeAlertRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Audio play prevented', e));
    }
  };


  const handleKnock = () => {
    if (activeGroup) {
      sendGroupMessage('knock', 'bateu na tela de todos!');
    } else {
      sendDatabaseMessage('knock', 'bateu na tela!');
    }
    triggerNativeKnock();
    
    const audio = new Audio('/sounds/msn-knock.mp3');
    audio.play().catch(e => console.log('Audio play prevented', e));
    
    // Visual "Knock" Animation (MSN Style)
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-colors duration-75';
    
    const fist = document.createElement('div');
    fist.innerText = '👊';
    fist.style.fontSize = '12rem';
    fist.style.transform = 'scale(0.1)';
    fist.style.opacity = '0';
    fist.style.transition = 'all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    fist.style.filter = 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))';
    
    overlay.appendChild(fist);
    document.body.appendChild(overlay);
    
    // Quick screen shake effect on the root
    const root = document.getElementById('root');
    if (root) {
      root.style.transition = 'transform 0.05s';
      root.style.transform = 'translate(-10px, 10px)';
    }

    // Trigger animation frame
    requestAnimationFrame(() => {
      fist.style.transform = 'scale(1)';
      fist.style.opacity = '1';
      overlay.style.backgroundColor = 'rgba(255,255,255,0.4)';
    });
    
    // Revert animation
    setTimeout(() => {
      if (root) root.style.transform = 'translate(0, 0)';
      fist.style.transform = 'scale(1.5)';
      fist.style.opacity = '0';
      overlay.style.backgroundColor = 'transparent';
    }, 150);
    
    setTimeout(() => overlay.remove(), 400);
  };

  const handleSound = (_soundType: string, soundUrl: string, label: string) => {
    if (activeGroup) {
      sendGroupMessage('sound', `🎵 enviou o som: ${label}`);
    } else {
      sendDatabaseMessage('sound', `🎵 enviou o som: ${label}`);
    }
    const audio = new Audio(soundUrl);
    audio.play().catch(e => console.log('Audio play prevented', e));
    setShowSounds(false);
  };

  const handleAudioMessage = (audioUrl: string) => {
    if (activeGroup) {
      sendGroupMessage('audio', audioUrl);
    } else {
      sendDatabaseMessage('audio', audioUrl);
    }
  };

  return (
    <div className="flex h-full p-2.5 gap-3">
      {/* Left Column: Chat and Input */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        
        {/* Chat History Box */}
        <div className="flex-1 bg-white border border-[#8BADC4] p-3 overflow-y-auto shadow-inner text-[13px] font-['Tahoma'] flex flex-col gap-1">
          <div className="text-xs text-[#999] mb-4 text-center border-b border-[#EEE] pb-1">
            Nunca forneça sua senha ou informações de cartão de crédito.
          </div>
          
          {currentMessages.map((msg) => (
            <div key={msg.id} className="mb-1">
              <div className="text-gray-500 font-bold mb-0.5">
                {msg.senderName} diz:
              </div>
              
              {msg.type === 'text' && (
                <div className="ml-3 text-black">
                  {msg.content}
                </div>
              )}

              {msg.type === 'image' && (
                <div className="ml-3 mt-1">
                  <img
                    src={msg.content}
                    alt="Imagem gerada pelo Gemini"
                    className="max-w-[280px] max-h-[280px] rounded border border-[#8BADC4] shadow-sm object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(msg.content, '_blank')}
                    title="Clique para abrir em tamanho completo"
                  />
                </div>
              )}
              
              {msg.type === 'shake' && (
                <div className="text-orange-600 font-bold ml-3 my-1 flex items-center gap-2">
                  <span className="anim-ring inline-block" style={{display:'inline-block'}}>📳</span>
                  *** {msg.senderName} {msg.content} ***
                </div>
              )}

              {msg.type === 'nudge' && (
                <div className="text-red-600 font-bold ml-3 my-1">
                  *** {msg.senderName} {msg.content} ***
                </div>
              )}

              {msg.type === 'knock' && (
                <div className="text-amber-700 font-bold ml-3 my-1">
                  *** {msg.senderName} {msg.content} ***
                </div>
              )}

              {msg.type === 'sound' && (
                <div className="text-purple-700 font-bold ml-3 my-1">
                  {msg.content}
                </div>
              )}

              {msg.type === 'audio' && (
                <div className="ml-3 mt-1">
                  <audio src={msg.content} controls className="h-8 max-w-[200px]" />
                </div>
              )}
            </div>
          ))}

          {/* Indicador de digitando do Gemini */}
          {isGeminiTyping && (
            <div className="mb-1">
              <div className="text-gray-500 font-bold mb-0.5">Assistente Gemini diz:</div>
              <div className="ml-3 flex items-center gap-1 text-[#2272A8] italic text-xs">
                <span className="inline-flex gap-0.5 items-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2272A8] animate-bounce" style={{animationDelay:'0ms'}} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2272A8] animate-bounce" style={{animationDelay:'150ms'}} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2272A8] animate-bounce" style={{animationDelay:'300ms'}} />
                </span>
                <span>pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action Toolbar */}
        <div className="bg-gradient-to-b from-[#F9FCFD] to-[#EAF2F8] border border-[#8BADC4] p-1 flex gap-1 items-center rounded-sm relative">
          {/* ── Emoji Picker ── */}
          <div className="relative">
            <button
              id="emoji-picker-btn"
              onClick={() => setShowEmojis(v => !v)}
              className={`p-1 border rounded flex items-center justify-center transition-colors ${showEmojis ? 'bg-[#C4DEFF] border-[#4A90D9]' : 'hover:bg-[#D5E6F2] hover:border-[#A0C0DB] border-transparent'}`}
              title="Emoticons"
            >
              <span className="text-base leading-none">😊</span>
            </button>

            {showEmojis && (
              <>
                {/* Click-outside overlay */}
                <div className="fixed inset-0 z-40" onClick={() => setShowEmojis(false)} />
                {/* Picker popup */}
                <div className="absolute bottom-full left-0 mb-1 z-50 bg-[#F0F6FA] border border-[#8BADC4] shadow-2xl" style={{width: 272}}>
                  {/* Header */}
                  <div className="bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] px-2 py-1 text-[10px] font-bold text-[#091F41] border-b border-[#8BADC4] flex items-center gap-1">
                    <span>😊</span> Emoticons
                  </div>
                  {/* Grid */}
                  <div className="p-1.5 grid grid-cols-10 gap-0.5">
                    {[
                      '😊','😁','😂','😉','😛','😮','😠','😐','😢','😎',
                      '😘','❤️','💔','😇','😈','😳','🤔','🤦','😴','🥱',
                      '👍','👎','👏','🤝','💪','✌️','🤞','🖐️','🙏','👊',
                      '🌹','☕','🎵','📞','⭐','🎂','🎉','🎁','🏆','🔥',
                      '💀','👻','🎃','🐱','🦋','🐶','🐸','🐧','🦄','🐝',
                      '🍕','🍔','🍺','🍭','🍦','🌮','🍣','🍩','🧁','🍿',
                    ].map((em, i) => (
                      <button
                        key={i}
                        onClick={() => insertEmoji(em)}
                        className="w-6 h-6 flex items-center justify-center text-[15px] hover:bg-[#C4DEFF] hover:scale-125 transition-all rounded-sm leading-none"
                        title={em}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-[#8BADC4] mx-0.5 opacity-50" />

          <button 
            id="shake-screen-btn"
            onClick={handleShake} 
            className="p-1 hover:bg-[#FFE8CC] hover:border-[#E8A060] border border-transparent rounded flex items-center justify-center relative group" 
            title="Chamar Atenção"
          >
            <span className="text-base group-hover:anim-shake-face inline-block" style={{display:'inline-block'}}>😲</span>
          </button>
          
          <button 
            onClick={handleKnock} 
            className="p-1 hover:bg-[#D5E6F2] hover:border-[#A0C0DB] border border-transparent rounded flex items-center justify-center relative" 
            title="Bater na Tela"
          >
            <span className="text-base">✊</span>
          </button>
          
          <div className="h-5 w-px bg-[#8BADC4] mx-1 opacity-50"></div>
          
          <div className="relative">
            <button 
              onClick={() => setShowSounds(!showSounds)}
              className="px-2 py-1 hover:bg-[#D5E6F2] hover:border-[#A0C0DB] border border-transparent rounded text-xs flex items-center gap-1 text-[#3E5C76]"
            >
              <span className="text-base">🎵</span> Sons ▼
            </button>
            
            {showSounds && (
              <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-[#8BADC4] shadow-lg text-xs z-10">
                <button 
                  onClick={() => handleSound('fart', '/sounds/msn-fart.mp3', 'Peido')}
                  className="w-full text-left px-3 py-2 hover:bg-[#EAF2F8] border-b border-[#EEE]"
                >
                  💨 Peido
                </button>
                <button 
                  onClick={() => handleSound('burp', '/sounds/msn-burp.mp3', 'Arroto')}
                  className="w-full text-left px-3 py-2 hover:bg-[#EAF2F8]"
                >
                  🤢 Arroto
                </button>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-[#8BADC4] mx-1 opacity-50"></div>
          
          <AudioRecorder onSendAudio={handleAudioMessage} />
        </div>

        {/* Input Box and Send Button */}
        <div className="flex gap-2 h-20">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-white border border-[#8BADC4] p-2 resize-none outline-none font-['Tahoma'] text-sm shadow-inner"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
               if(e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSendText(e as any);
               }
            }}
          />
          <button 
            onClick={handleSendText} 
            className="w-[72px] bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] border border-[#8BADC4] rounded-sm font-['Tahoma'] text-xs text-[#3E5C76] hover:bg-gradient-to-b hover:from-[#E8F2F9] hover:to-[#CDE0EF] active:bg-[#C1D6E8] shadow-sm flex items-center justify-center cursor-pointer"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Right Column: Avatars — hidden on mobile */}
      {!mobileMode && (
      <div className="w-28 flex flex-col gap-2 border-l border-[#8BADC4]/30 pl-2">
        {/* Contact or Group Avatar */}
        <div className="flex flex-col items-center group">
          {activeGroup ? (
            <>
              {/* Group View */}
              <div className="w-28 h-28 bg-white border border-[#8BADC4] p-1 shadow-sm grid grid-cols-2 grid-rows-2 gap-0.5 relative">
                {activeGroup.members.slice(0, 4).map((member, _i) => (
                  <div key={member.userId} className="w-full h-full bg-[#E8F2F9] overflow-hidden flex items-center justify-center border border-[#EEE]">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-[#3E5C76] font-bold">{member.name.charAt(0)}</span>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-xs mt-1 font-bold text-[#091F41] bg-white/50 px-2 rounded-sm truncate w-full text-center">
                {activeGroup.name}
              </span>
              <div className="text-[10px] text-[#5A7A99] mt-1 text-center leading-tight">
                {activeGroup.members.length} membros
              </div>
            </>
          ) : (
            <>
              {/* Individual Contact View */}
              <div className="w-28 h-28 bg-white border border-[#8BADC4] p-1 shadow-sm">
                {activeContact?.avatarUrl ? (
                  <img
                    src={activeContact.avatarUrl}
                    alt={activeContact.name}
                    className="w-full h-full object-cover border border-[#EEE]"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact?.name ?? 'Contato')}&background=00B4D8&color=fff&size=112`}
                    className="w-full h-full object-cover border border-[#EEE]"
                  />
                )}
              </div>
              <span className="text-xs mt-1 font-bold text-[#091F41] bg-white/50 px-2 rounded-sm truncate w-full text-center">
                {activeContact?.name ?? 'Contato'}
              </span>
            </>
          )}
        </div>
        
        <div className="flex-1"></div>

        {/* User Avatar */}
        <div className="flex flex-col items-center group">
          <div className="w-28 h-28 bg-white border border-[#8BADC4] p-1 shadow-sm relative">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover border border-[#EEE]" />
            ) : (
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Voce')}&background=0077B6&color=fff&size=112`} className="w-full h-full object-cover border border-[#EEE]" />
            )}
            <div className="absolute top-2 right-2 w-3 h-3 bg-[#23B618] rounded-full border border-white shadow-md"></div>
          </div>
          {/* Status Editor */}
          <div className="mt-1 w-full flex justify-center">
            <StatusEditor />
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
