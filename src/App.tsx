import { useEffect, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ContactList } from './components/ContactList';
import { AuthScreen } from './components/AuthScreen';
import { OnlineToasts } from './components/OnlineToasts';
import { useAppStore } from './store';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { usePushNotifications } from './hooks/usePushNotifications';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');

  usePushNotifications();

  const isShaking       = useAppStore(state => state.isShaking);
  const contacts        = useAppStore(state => state.contacts);
  const activeContactId = useAppStore(state => state.activeContactId);
  const groups          = useAppStore(state => state.groups);
  const activeGroupId   = useAppStore(state => state.activeGroupId);
  const fetchProfileAndContacts = useAppStore(state => state.fetchProfileAndContacts);
  const fetchGroups = useAppStore(state => state.fetchGroups);
  const subscribeToRealtime = useAppStore(state => state.subscribeToRealtime);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const activeGroup   = groups.find(g => g.id === activeGroupId);

  // Quando seleciona um contato/grupo no mobile, navega para a tela de chat
  useEffect(() => {
    if (activeContactId || activeGroupId) {
      setMobileView('chat');
    }
  }, [activeContactId, activeGroupId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Monitoramento de sessão ativa para carga e realtime do Supabase
  useEffect(() => {
    if (!session?.user?.id) return;

    fetchProfileAndContacts(session.user.id);
    fetchGroups(session.user.id);
    const unsubscribe = subscribeToRealtime(session.user.id);

    return () => unsubscribe();
  }, [session, fetchProfileAndContacts, fetchGroups, subscribeToRealtime]);

  if (loadingSession) {
    return (
      <div className="h-screen w-screen bg-[#C4E0F9] flex items-center justify-center font-['Tahoma']">
        <div className="text-[#091F41] font-bold">Entrando...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const chatTitle = activeGroup
    ? activeGroup.name
    : (activeContact?.name ?? 'Selecione um contato');

  return (
    <div
      className={`min-h-screen flex bg-[#B8D4E8] ${isShaking ? 'animate-shake-screen' : ''}`}
      style={{ fontFamily: 'Tahoma, sans-serif' }}
    >

      {/* ════════════════════════════════════════
          DESKTOP LAYOUT (md e acima)
      ════════════════════════════════════════ */}
      <div className="hidden md:flex items-center justify-center w-full p-4 gap-2">
        {/* ── Contact List Window ── */}
        <ContactList />

        {/* ── Chat Window ── */}
        <div
          className="wizz-window flex-1 bg-[#E8F2F9] shadow-2xl rounded-t-lg overflow-hidden border border-[#8BADC4] flex flex-col text-[13px]"
          style={{ height: '85vh', minHeight: 600, maxWidth: 640 }}
        >
          {/* Window Title Bar */}
          <div className="bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] px-2 py-1.5 flex items-center gap-2 border-b border-[#8BADC4]">
            <div className="w-4 h-4 bg-[#23B618] rounded-full border border-[#14760D] shadow-sm flex items-center justify-center relative">
              <div className="absolute top-[2px] right-[2px] w-1.5 h-1.5 bg-white/60 rounded-full" />
            </div>
            <span className="font-semibold text-[#091F41] flex-1 text-sm drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
              WizzApp — {chatTitle}
            </span>
            <div className="flex gap-0.5">
              <button className="w-6 h-5 bg-[#C9DEF0] border border-[#A0C0DB] hover:bg-[#A9CDE8] rounded-sm text-xs font-bold shadow-inner flex items-center justify-center leading-none pb-1">_</button>
              <button className="w-6 h-5 bg-[#C9DEF0] border border-[#A0C0DB] hover:bg-[#A9CDE8] rounded-sm text-xs font-bold shadow-inner flex items-center justify-center leading-none">□</button>
              <button className="w-6 h-5 bg-[#E08A8A] border border-[#C55A5A] hover:bg-[#D46060] text-white rounded-sm text-xs font-bold shadow-inner flex items-center justify-center leading-none pb-0.5">×</button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-[#F2F7FA] border-b border-[#8BADC4] flex gap-3 px-3 py-1.5 text-[#3E5C76] text-xs">
            <button className="hover:text-[#000] hover:bg-[#D5E6F2] px-1 rounded transition-colors">Arquivo</button>
            <button className="hover:text-[#000] hover:bg-[#D5E6F2] px-1 rounded transition-colors">Editar</button>
            <button className="hover:text-[#000] hover:bg-[#D5E6F2] px-1 rounded transition-colors">Ações</button>
            <button className="hover:text-[#000] hover:bg-[#D5E6F2] px-1 rounded transition-colors">Ferramentas</button>
            <button className="hover:text-[#000] hover:bg-[#D5E6F2] px-1 rounded transition-colors">Ajuda</button>
          </div>

          {/* Main Area */}
          <div className="flex-1 w-full h-full bg-gradient-to-b from-[#E8F2F9] to-[#DCEAF4] overflow-hidden">
            <ChatWindow activeContact={activeContact} activeGroup={activeGroup} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE LAYOUT (menor que md)
          Navegação em pilha: Contatos → Chat
      ════════════════════════════════════════ */}
      <div className="flex md:hidden w-full h-screen flex-col overflow-hidden">

        {/* ── Painel: Lista de Contatos ── */}
        <div
          className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${
            mobileView === 'contacts' ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header mobile */}
          <div className="bg-gradient-to-b from-[#1B5FAA] to-[#3A91E8] flex items-center justify-between px-4 py-3 shadow-md"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <div className="flex items-center gap-2">
              <img src="/icons/icon-192.png" className="w-7 h-7 rounded-lg shadow-sm" onError={e => (e.currentTarget.style.display='none')} />
              <span className="text-white font-bold text-[16px]">WizzApp</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ContactList onContactSelect={() => setMobileView('chat')} />
          </div>
        </div>

        {/* ── Painel: Chat Window ── */}
        <div
          className={`absolute inset-0 flex flex-col bg-[#E8F2F9] transition-transform duration-300 ease-in-out ${
            mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header mobile com botão Voltar */}
          <div
            className="bg-gradient-to-b from-[#1B5FAA] to-[#3A91E8] flex items-center gap-3 px-4 py-3 shadow-md"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
          >
            <button
              onClick={() => setMobileView('contacts')}
              className="text-white text-[22px] leading-none pr-1 active:opacity-60"
              aria-label="Voltar"
            >
              ‹
            </button>
            {/* Avatar do contato ativo */}
            {activeContact?.avatarUrl ? (
              <img src={activeContact.avatarUrl} className="w-16 h-16 md:w-12 md:h-12 md:w-8 md:h-8 rounded-full border-2 border-white/50 object-cover" />
            ) : (
              <div className="w-16 h-16 md:w-12 md:h-12 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-[13px] font-bold">
                {chatTitle.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-[18px] md:text-[14px] truncate">{chatTitle}</div>
              {activeContact && (
                <div className="text-white/70 text-[15px] md:text-[11px] truncate">{activeContact.statusMessage || 'Online'}</div>
              )}
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow activeContact={activeContact} activeGroup={activeGroup} mobileMode />
          </div>
        </div>

      </div>
      
      {/* Toast de quem fica online */}
      <OnlineToasts />
    </div>
  );
}

export default App;
