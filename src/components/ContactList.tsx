import React, { useState } from 'react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import type { Contact, ContactStatus } from '../store';
import { StatusEditor } from './StatusEditor';
import { AddContactModal } from './AddContactModal';
import { AvatarUploader } from './AvatarUploader';
import { CreateGroupModal } from './CreateGroupModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';

// ── Classic MSN blue silhouette avatar ──────────────────────────────────────
const MsnAvatar: React.FC<{ uid: string; size?: number; status?: ContactStatus; avatarUrl?: string }> = ({
  uid,
  size = 30,
  status = 'offline',
  avatarUrl,
}) => {
  const gId = `avG_${uid}`;
  const dotColor: Record<ContactStatus, string> = {
    online:  '#22C55E',
    away:    '#EAB308',
    busy:    '#EF4444',
    offline: '#9CA3AF',
  };

  const StatusDot = status !== 'offline' ? (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ position: 'absolute', top: 0, left: 0 }}>
      <circle cx="25.5" cy="24.5" r="5" fill="white" />
      <circle cx="25.5" cy="24.5" r="4" fill={dotColor[status]} />
      <ellipse cx="24" cy="23" rx="1.5" ry="1" fill="white" opacity="0.5" />
    </svg>
  ) : null;

  if (avatarUrl) {
    return (
      <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded shadow-sm border border-[#8BADC4]" />
        {StatusDot}
      </div>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={gId} cx="38%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#B8DEFA" />
          <stop offset="100%" stopColor="#3A8FCC" />
        </radialGradient>
      </defs>
      {/* Background circle */}
      <circle cx="16" cy="16" r="15.5" fill={`url(#${gId})`} stroke="#2272A8" strokeWidth="0.8" />
      {/* Gloss highlight */}
      <ellipse cx="11" cy="8" rx="6" ry="3.5" fill="white" opacity="0.22" />
      {/* Head */}
      <circle cx="16" cy="12" r="5.2" fill="white" opacity="0.93" />
      {/* Shoulders */}
      <path d="M5 28 Q5 19 16 19 Q27 19 27 28 Z" fill="white" opacity="0.93" />
      {/* Status indicator */}
      {status !== 'offline' && (
        <>
          <circle cx="25.5" cy="24.5" r="5"   fill="white" />
          <circle cx="25.5" cy="24.5" r="4"   fill={dotColor[status]} />
          {/* Gloss on dot */}
          <ellipse cx="24" cy="23" rx="1.5" ry="1" fill="white" opacity="0.5" />
        </>
      )}
    </svg>
  );
};

// ── Large MSN avatar for the user panel ─────────────────────────────────────
const MsnAvatarLarge: React.FC<{ uid: string; avatarUrl?: string }> = ({ uid, avatarUrl }) => {
  const gId = `avGL_${uid}`;

  if (avatarUrl) {
    return (
      <div className="w-[52px] h-[52px] flex-shrink-0 relative group cursor-pointer border border-[#8BADC4] shadow-sm rounded overflow-hidden">
        <img src={avatarUrl} alt="Meu Avatar" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-[18px] md:text-[14px] md:text-[10px] font-bold">Mudar</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group cursor-pointer">
      <svg width="52" height="52" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
        <defs>
          <radialGradient id={gId} cx="36%" cy="28%" r="70%">
            <stop offset="0%"   stopColor="#C8E8FB" />
            <stop offset="100%" stopColor="#3080C0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="64" height="64" rx="4" fill={`url(#${gId})`} stroke="#2272A8" strokeWidth="1" />
        <ellipse cx="22" cy="14" rx="12" ry="7" fill="white" opacity="0.2" />
        <circle cx="32" cy="23" r="11" fill="white" opacity="0.93" />
        <path d="M8 58 Q8 38 32 38 Q56 38 56 58 Z" fill="white" opacity="0.93" />
      </svg>
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
        <span className="text-white text-[18px] md:text-[14px] md:text-[10px] font-bold">Mudar</span>
      </div>
    </div>
  );
};

// ── Contact row ──────────────────────────────────────────────────────────────
const ContactRow: React.FC<{ contact: Contact; isActive: boolean; onClick: () => void }> = ({
  contact,
  isActive,
  onClick,
}) => (
  <button
    id={`contact-row-${contact.id}`}
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-2 py-1 text-left transition-colors group rounded-sm ${
      isActive
        ? 'bg-[#C8DFEF] border-l-2 border-[#3A8FCC]'
        : 'hover:bg-[#DCE9F5] border-l-2 border-transparent'
    }`}
  >
    <MsnAvatar uid={contact.id} size={26} status={contact.status} avatarUrl={contact.avatarUrl} />
    <div className="flex-1 min-w-0">
      <div className="text-[16px] md:text-[12px] font-bold text-[#091F41] truncate leading-tight">
        {contact.name}
      </div>
      {contact.statusMessage ? (
        <div className="text-[18px] md:text-[14px] md:text-[10px] text-[#5A7A99] truncate leading-tight italic">
          {contact.statusMessage}
        </div>
      ) : null}
    </div>
  </button>
);

// ── Group header (collapsible section) ───────────────────────────────────────
const GroupHeader: React.FC<{
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}> = ({ label, count, open, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-1 px-2 py-1 hover:bg-[#D5E6F2] transition-colors border-b border-[#C8DAEA] text-left"
  >
    <span className="text-[18px] md:text-[14px] md:text-[10px] text-[#3E5C76] font-bold select-none">
      {open ? '▼' : '▶'}
    </span>
    <span className="text-[15px] md:text-[11px] font-bold text-[#3E5C76] flex-1">
      {label} ({count})
    </span>
  </button>
);

// ── Main component ───────────────────────────────────────────────────────────
export const ContactList: React.FC<{ onContactSelect?: () => void }> = ({ onContactSelect }) => {
  const {
    currentUser, contacts, activeContactId, setActiveContact,
    acceptContactRequest, declineContactRequest,
    groups, activeGroupId, setActiveGroup,
  } = useAppStore();
  const [search, setSearch] = useState('');
  const [onlineOpen, setOnlineOpen] = useState(true);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [pendingReceivedOpen, setPendingReceivedOpen] = useState(true);
  const [pendingSentOpen, setPendingSentOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const accepted = filtered.filter(c => c.relationStatus === 'accepted');
  const online  = accepted.filter(c => c.status !== 'offline');
  const offline = accepted.filter(c => c.status === 'offline');
  const pendingReceived = filtered.filter(c => c.relationStatus === 'pending' && !c.isInitiator);
  const pendingSent = filtered.filter(c => c.relationStatus === 'pending' && c.isInitiator);

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="w-full md:w-[240px] flex-shrink-0 bg-[#E8F2F9] md:border md:border-[#8BADC4] md:shadow-2xl flex flex-col font-['Tahoma'] text-[13px]"
      style={{ height: '100%', minHeight: 0 }}
    >
      {/* ── Title bar — apenas no desktop ── */}
      <div className="hidden md:flex bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] px-2 py-1.5 items-center gap-2 border-b border-[#8BADC4]">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7.5" fill="#2272A8" />
          <circle cx="8" cy="6"  r="3"   fill="white" opacity="0.9" />
          <path d="M2 14 Q2 9 8 9 Q14 9 14 14" fill="white" opacity="0.9" />
        </svg>
        <span className="font-semibold text-[#091F41] flex-1 text-xs drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
          WizzApp
        </span>
        <div className="flex gap-0.5">
          <button className="w-5 h-4 bg-[#C9DEF0] border border-[#A0C0DB] hover:bg-[#A9CDE8] rounded-sm text-[18px] md:text-[14px] md:text-[10px] font-bold flex items-center justify-center leading-none pb-0.5">_</button>
          <button className="w-5 h-4 bg-[#C9DEF0] border border-[#A0C0DB] hover:bg-[#A9CDE8] rounded-sm text-[18px] md:text-[14px] md:text-[10px] font-bold flex items-center justify-center">□</button>
          <button className="w-5 h-4 bg-[#E08A8A] border border-[#C55A5A] hover:bg-[#D46060] text-white rounded-sm text-[18px] md:text-[14px] md:text-[10px] font-bold flex items-center justify-center leading-none">×</button>
        </div>
      </div>

      {/* ── Current user panel ── */}
      <div className="bg-gradient-to-b from-[#F2F8FD] to-[#DFF0FA] border-b border-[#8BADC4] p-2 flex items-start gap-2">
        <div onClick={() => setShowAvatarUploader(true)}>
          <MsnAvatarLarge uid="me" avatarUrl={currentUser.avatarUrl} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 pt-0.5">
          <div className="flex justify-between items-center gap-1">
            <div className="text-[16px] md:text-[12px] font-bold text-[#091F41] truncate">{currentUser.name}</div>
            <button
              onClick={async () => {
                await useAppStore.getState().updateUserStatus('Offline', '😴', 'offline');
                supabase.auth.signOut();
              }}
              className="text-[18px] md:text-[14px] md:text-[10px] text-[#5A7A99] hover:text-[#E08A8A] font-bold transition-colors"
              title="Sair do WizzApp"
            >
              Sair
            </button>
          </div>
          {currentUser.username && (
            <div className="text-[18px] md:text-[14px] md:text-[10px] text-[#2272A8] font-bold truncate leading-none mb-0.5 select-all" title={currentUser.email}>
              @{currentUser.username}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center -ml-1 relative">
              <select
                value={currentUser.status}
                onChange={(e) => useAppStore.getState().updateUserStatus(currentUser.statusMessage, currentUser.statusEmoticon, e.target.value as any)}
                className="text-[18px] md:text-[14px] md:text-[10px] text-[#4A6E8A] bg-transparent outline-none cursor-pointer hover:bg-[#DFF0FA] rounded py-0.5 pl-1 pr-4"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                title="Alterar status"
              >
                <option value="online">🟢 Online</option>
                <option value="away">🟡 Ausente</option>
                <option value="busy">🔴 Ocupado</option>
                <option value="offline">⚪ Offline</option>
              </select>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[15px] md:text-[11px] md:text-[8px] text-[#4A6E8A] pointer-events-none">▼</span>
            </div>
            <button
              onClick={() => setShowProfileSettings(true)}
              className="text-[18px] md:text-[14px] md:text-[10px] text-[#5A7A99] hover:text-[#1B5FAA] transition-colors"
              title="Configurações do perfil"
            >
              ⚙️
            </button>
          </div>
          {/* Status editor inline */}
          <div className="mt-0.5">
            <StatusEditor />
          </div>
        </div>
      </div>

      {/* ── Search bar & buttons ── */}
      <div className="bg-[#F0F6FA] border-b border-[#8BADC4] px-2 py-2 flex items-center gap-1.5">
        <div className="flex-1 flex items-center gap-1 bg-white border border-[#A0C0DB] px-1.5 py-1.5 rounded-sm shadow-inner focus-within:border-[#4A90D9]">
          <svg width="13" height="13" viewBox="0 0 16 16" className="text-[#8BADC4] flex-shrink-0">
            <circle cx="6.5" cy="6.5" r="5" stroke="#8BADC4" strokeWidth="1.5" fill="none" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="#8BADC4" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="contact-search"
            type="text"
            placeholder="Encontrar contato..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-[16px] md:text-[12px] font-['Tahoma'] outline-none"
          />
        </div>

        {/* Botão adicionar contato */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-6 h-6 flex-shrink-0 bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] border border-[#8BADC4] hover:from-[#E8F2F9] hover:to-[#CDE0EF] rounded-sm flex items-center justify-center shadow-sm"
          title="Adicionar Contato"
        >
          <svg width="14" height="14" viewBox="0 0 16 16">
            <circle cx="6" cy="5" r="3" fill="#2272A8" />
            <path d="M1 14 Q1 9 6 9 Q11 9 11 14" fill="#2272A8" />
            <circle cx="12" cy="11" r="4" fill="#22C55E" />
            <path d="M10 11 L14 11 M12 9 L12 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Botão criar grupo */}
        <button
          onClick={() => setShowCreateGroup(true)}
          className="w-6 h-6 flex-shrink-0 bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] border border-[#8BADC4] hover:from-[#E8F2F9] hover:to-[#CDE0EF] rounded-sm flex items-center justify-center shadow-sm"
          title="Criar Grupo"
        >
          <svg width="14" height="14" viewBox="0 0 16 16">
            {/* Duas pessoas */}
            <circle cx="5" cy="5" r="2.3" fill="#6A4EB5" />
            <path d="M1 13.5 Q1 9.5 5 9.5 Q7.5 9.5 8.5 11.5" fill="#6A4EB5" />
            <circle cx="10" cy="5" r="2.3" fill="#6A4EB5" />
            <path d="M7 13.5 Q7.5 9.5 10 9.5 Q14 9.5 15 13.5" fill="#6A4EB5" />
            {/* Mais */}
            <circle cx="12.5" cy="3" r="3" fill="#22C55E" />
            <path d="M11 3 L14 3 M12.5 1.5 L12.5 4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Contact list ── */}
      <div className="flex-1 overflow-y-auto bg-white">

        {/* Solicitações Pendentes (Recebidas) */}
        {pendingReceived.length > 0 && (
          <>
            <GroupHeader
              label="Solicitações Pendentes"
              count={pendingReceived.length}
              open={pendingReceivedOpen}
              onToggle={() => setPendingReceivedOpen(v => !v)}
            />
            {pendingReceivedOpen && pendingReceived.map(c => (
              <div key={c.id} className="w-full flex items-center justify-between gap-1 px-2 py-1.5 hover:bg-[#F2DEDE] border-b border-[#EEE]">
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <MsnAvatar uid={c.id} size={22} status="offline" avatarUrl={c.avatarUrl} />
                  <span className="text-[15px] md:text-[11px] font-bold text-[#A94442] truncate" title={`${c.name} (@${c.username})`}>
                    {c.name}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => c.relationId && acceptContactRequest(c.relationId)}
                    className="px-1.5 py-0.5 bg-[#22C55E] text-white text-[18px] md:text-[14px] md:text-[10px] font-bold rounded hover:bg-[#16A34A] shadow-sm leading-none cursor-pointer"
                    title="Aceitar"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => c.relationId && declineContactRequest(c.relationId)}
                    className="px-1.5 py-0.5 bg-[#EF4444] text-white text-[18px] md:text-[14px] md:text-[10px] font-bold rounded hover:bg-[#DC2626] shadow-sm leading-none cursor-pointer"
                    title="Recusar"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Convites Enviados (Pendentes) */}
        {pendingSent.length > 0 && (
          <>
            <GroupHeader
              label="Convites Enviados"
              count={pendingSent.length}
              open={pendingSentOpen}
              onToggle={() => setPendingSentOpen(v => !v)}
            />
            {pendingSentOpen && pendingSent.map(c => (
              <div key={c.id} className="w-full flex items-center justify-between gap-1 px-2 py-1.5 hover:bg-[#FFF8E7] border-b border-[#EEE] opacity-75">
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <MsnAvatar uid={c.id} size={22} status="offline" avatarUrl={c.avatarUrl} />
                  <span className="text-[15px] md:text-[11px] text-[#8A6D3B] truncate italic" title={`${c.name} (@${c.username})`}>
                    {c.name} (Pendente)
                  </span>
                </div>
                <button
                  onClick={() => c.relationId && declineContactRequest(c.relationId)}
                  className="px-1 py-0.5 bg-[#AAA] text-white text-[16px] md:text-[12px] md:text-[9px] hover:bg-[#888] rounded cursor-pointer leading-none"
                  title="Cancelar Convite"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </>
        )}

        {/* Online group */}
        <GroupHeader
          label="Online"
          count={online.length}
          open={onlineOpen}
          onToggle={() => setOnlineOpen(v => !v)}
        />
        {onlineOpen && online.map(c => (
          <ContactRow
            key={c.id}
            contact={c}
            isActive={c.id === activeContactId}
            onClick={() => {
              setActiveContact(c.id);
              if (onContactSelect) onContactSelect();
            }}
          />
        ))}

        {/* Offline group */}
        <GroupHeader
          label="Offline"
          count={offline.length}
          open={offlineOpen}
          onToggle={() => setOfflineOpen(v => !v)}
        />
        {offlineOpen && offline.map(c => (
          <ContactRow
            key={c.id}
            contact={c}
            isActive={c.id === activeContactId}
            onClick={() => {
              setActiveContact(c.id);
              if (onContactSelect) onContactSelect();
            }}
          />
        ))}

        {/* ── Seção de Grupos ── */}
        {filteredGroups.length > 0 && (
          <>
            <GroupHeader
              label="Grupos"
              count={filteredGroups.length}
              open={groupsOpen}
              onToggle={() => setGroupsOpen(v => !v)}
            />
            {groupsOpen && filteredGroups.map(g => (
              <button
                key={g.id}
                id={`group-row-${g.id}`}
                onClick={() => {
                  setActiveGroup(g.id);
                  if (onContactSelect) onContactSelect();
                }}
                className={`w-full flex items-center gap-2 px-2 py-1 text-left transition-colors rounded-sm ${
                  g.id === activeGroupId
                    ? 'bg-[#DDD5F3] border-l-2 border-[#7C5CB8]'
                    : 'hover:bg-[#EDE8F8] border-l-2 border-transparent'
                }`}
              >
                {/* Ícone de grupo */}
                <div className="w-[26px] h-[26px] flex-shrink-0 bg-gradient-to-b from-[#9B7FD4] to-[#6A4EB5] rounded-sm flex items-center justify-center shadow-sm border border-[#7C5CB8]">
                  <span className="text-white text-[13px] leading-none">👥</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] md:text-[12px] font-bold text-[#3A1E7A] truncate leading-tight">
                    {g.name}
                  </div>
                  <div className="text-[18px] md:text-[14px] md:text-[10px] text-[#7C5CB8] truncate leading-tight">
                    {g.members.length} membro{g.members.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {filtered.length === 0 && filteredGroups.length === 0 && (
          <div className="text-center text-[15px] md:text-[11px] text-[#999] py-6 italic">
            Nenhum contato encontrado
          </div>
        )}
      </div>

      {/* ── Bottom status bar ── */}
      <div className="bg-[#DFF0FA] border-t border-[#8BADC4] px-2 py-1 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7" fill="#3A8FCC" />
          <text x="8" y="12" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">i</text>
        </svg>
        <span className="text-[18px] md:text-[14px] md:text-[10px] text-[#3E5C76]">
          {online.length} contato{online.length !== 1 ? 's' : ''} online
          {groups.length > 0 && ` · ${groups.length} grupo${groups.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} />}
      {showAvatarUploader && <AvatarUploader onClose={() => setShowAvatarUploader(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      {showProfileSettings && <ProfileSettingsModal onClose={() => setShowProfileSettings(false)} />}
    </div>
  );
};
