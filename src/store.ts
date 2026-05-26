import { create } from 'zustand';
import { supabase } from './lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { chatWithGemini } from './lib/gemini';

const GEMINI_BOT_CONTACT: Contact = {
  id: 'gemini-bot',
  name: 'Assistente Gemini',
  username: 'gemini',
  avatarUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  status: 'online',
  statusMessage: 'Pronto para ajudar com IA!',
  statusEmoticon: '🤖',
  relationStatus: 'accepted',
};

export type MessageType = 'text' | 'nudge' | 'knock' | 'sound' | 'audio' | 'shake' | 'image';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  timestamp: number;
}

export type ContactStatus = 'online' | 'away' | 'busy' | 'offline';

export interface Contact {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  status: ContactStatus;
  statusMessage: string;
  statusEmoticon?: string;
  relationId?: string;
  relationStatus?: 'pending' | 'accepted' | 'blocked';
  isInitiator?: boolean;
}

export interface GroupMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  status: ContactStatus;
}

export interface Group {
  id: string;
  name: string;
  avatarUrl?: string;
  createdBy: string;
  members: GroupMember[];
}

interface AppState {
  currentUser: { 
    id: string; 
    name: string; 
    email?: string;
    username?: string;
    avatarUrl?: string; 
    status: ContactStatus; 
    statusMessage: string; 
    statusEmoticon: string 
  };
  contacts: Contact[];
  activeContactId: string | null;
  messages: Message[];
  geminiSession: Message[];
  isNudging: boolean;
  isShaking: boolean;
  isGeminiTyping: boolean;

  // Grupos
  groups: Group[];
  activeGroupId: string | null;
  groupMessages: Message[];

  // Ações básicas de UI
  setActiveContact: (id: string) => void;
  triggerShake: () => void;

  // Ações do Supabase
  fetchProfileAndContacts: (userId: string) => Promise<void>;
  updateUserStatus: (statusMessage: string, emoticon: string, status?: ContactStatus) => Promise<void>;
  updateProfile: (fields: { name?: string; username?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  subscribeToRealtime: (userId: string) => () => void;

  // Mensagens individuais
  fetchMessages: (userId: string, friendId: string) => Promise<void>;
  subscribeToMessages: (userId: string, activeContactId: string) => void;
  sendDatabaseMessage: (type: MessageType, content: string) => Promise<void>;

  // Grupos
  setActiveGroup: (id: string) => Promise<void>;
  fetchGroups: (userId: string) => Promise<void>;
  createGroup: (name: string, memberIds: string[]) => Promise<void>;
  sendGroupMessage: (type: MessageType, content: string) => Promise<void>;
  subscribeToGroupMessages: (groupId: string) => void;

  // Relacionamentos
  acceptContactRequest: (relationId: string) => Promise<void>;
  declineContactRequest: (relationId: string) => Promise<void>;

  // Online Toasts
  onlineToasts: { id: string; name: string }[];
  addOnlineToast: (name: string) => void;
  removeOnlineToast: (id: string) => void;
  muteOnlineSound: boolean;
  setMuteOnlineSound: (mute: boolean) => void;
}

// Auxiliares de canais de realtime
let contactsChannel: RealtimeChannel | null = null;
let profilesChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;
let groupMessagesChannel: RealtimeChannel | null = null;
let groupMembersChannel: RealtimeChannel | null = null;

// Função auxiliar para carregar a lista de contatos do Supabase
const fetchContactsList = async (userId: string): Promise<Contact[]> => {
  const { data: relations, error } = await supabase
    .from('contacts')
    .select('*')
    .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

  if (error) {
    console.error('Erro ao carregar relações:', error);
    return [];
  }

  if (!relations || relations.length === 0) return [];

  const friendIds = relations.map(r => r.user_id === userId ? r.contact_id : r.user_id);

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds);

  if (profilesError) {
    console.error('Erro ao carregar perfis:', profilesError);
    return [];
  }

  return relations.map(r => {
    const friendId = r.user_id === userId ? r.contact_id : r.user_id;
    const profile = profiles?.find(p => p.id === friendId);
    return {
      id: friendId,
      name: profile?.name || profile?.email || 'Usuário do WizzApp',
      username: profile?.username || '',
      avatarUrl: profile?.avatar_url || '',
      status: (profile?.status || 'offline') as ContactStatus,
      statusMessage: profile?.status_message || '',
      statusEmoticon: profile?.status_emoticon || '😊',
      relationId: r.id,
      relationStatus: r.status as 'pending' | 'accepted' | 'blocked',
      isInitiator: r.user_id === userId,
    };
  });
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: '',
    name: 'Carregando...',
    email: '',
    username: '',
    avatarUrl: '',
    status: 'offline',
    statusMessage: '',
    statusEmoticon: '😊',
  },
  contacts: [],
  activeContactId: null,
  messages: [],
  geminiSession: [],
  isNudging: false,
  isShaking: false,
  isGeminiTyping: false,

  // Grupos — estado inicial
  groups: [],
  activeGroupId: null,
  groupMessages: [],

  // Online Toasts
  onlineToasts: [],
  muteOnlineSound: localStorage.getItem('wizzapp_mute_online') === 'true',
  setMuteOnlineSound: (mute) => {
    localStorage.setItem('wizzapp_mute_online', String(mute));
    set({ muteOnlineSound: mute });
  },
  addOnlineToast: (name) => {
    const id = Date.now().toString() + Math.random().toString();
    set(state => ({ onlineToasts: [...state.onlineToasts, { id, name }] }));
    if (!get().muteOnlineSound) {
      const audio = new Audio('/sounds/msn-message.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {}); // ignore autoplay restrictions
    }
  },
  removeOnlineToast: (id) => {
    set(state => ({ onlineToasts: state.onlineToasts.filter(t => t.id !== id) }));
  },

  setActiveContact: async (id) => {
    set({ activeContactId: id, activeGroupId: null });
    const { currentUser } = get();
    if (currentUser.id && id) {
      await get().fetchMessages(currentUser.id, id);
      get().subscribeToMessages(currentUser.id, id);
    }
  },

  triggerShake: () => {
    set({ isShaking: true });
    setTimeout(() => set({ isShaking: false }), 800);
  },

  fetchProfileAndContacts: async (userId) => {
    try {
      // 1. Carrega Perfil do Usuário Logado
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Se o perfil não existe (PGRST116 = 0 rows), cria automaticamente
      if (profileError && profileError.code === 'PGRST116') {
        const { data: authUser } = await supabase.auth.getUser();
        const userEmail = authUser?.user?.email || '';
        const base = userEmail.split('@')[0] || 'usuario';
        const fallbackName = base;
        // timestamp garante username único mesmo que o base já exista
        const fallbackUsername = base.toLowerCase().replace(/[^a-z0-9_]/g, '') + '_' + Date.now().toString(36);
        const inviteCode = 'WIZZ-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: userEmail,
            username: fallbackUsername,
            name: fallbackName,
            status: 'online',
            status_message: 'Disponível',
            status_emoticon: '😊',
            invite_code: inviteCode,
          }, { onConflict: 'id' })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar perfil automaticamente:', insertError);
          throw insertError;
        }
        profile = newProfile;
        profileError = null;
      }

      if (profileError) throw profileError;
      if (!profile) return;

      // Se o usuário estava 'offline' na última sessão, force-o para 'online' ao logar
      const wasOffline = profile.status === 'offline';
      const currentStatus = wasOffline ? 'online' : (profile.status || 'online');
      
      // Se a mensagem ficou travada como 'Offline' com o emoji de dormir, reseta para Disponível
      const stuckAsOfflineText = profile.status_message === 'Offline' && profile.status_emoticon === '😴';
      const currentMessage = (wasOffline || stuckAsOfflineText) && profile.status_message === 'Offline' ? 'Disponível' : (profile.status_message || 'Disponível');
      const currentEmoticon = (wasOffline || stuckAsOfflineText) && profile.status_emoticon === '😴' ? '😊' : (profile.status_emoticon || '😊');

      set({
        currentUser: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          username: profile.username,
          avatarUrl: profile.avatar_url || '',
          status: currentStatus as ContactStatus,
          statusMessage: currentMessage,
          statusEmoticon: currentEmoticon,
        }
      });

      // Se forçamos para online ou corrigimos o texto travado, atualiza no banco também
      if (wasOffline || stuckAsOfflineText) {
        supabase.from('profiles').update({ 
          status: 'online',
          status_message: currentMessage,
          status_emoticon: currentEmoticon
        }).eq('id', profile.id).then();
      }

      // 2. Carrega Relações de Contatos
      const list = await fetchContactsList(userId);
      set({ contacts: [GEMINI_BOT_CONTACT, ...list] });

      // Auto seleciona o primeiro contato aceito se houver e nenhum estiver ativo
      if (list.length > 0 && !get().activeContactId) {
        const firstAccepted = list.find(c => c.relationStatus === 'accepted');
        if (firstAccepted) {
          get().setActiveContact(firstAccepted.id);
        }
      }
    } catch (err) {
      console.error('Erro no fluxo de carga inicial:', err);
    }
  },

  updateUserStatus: async (statusMessage, emoticon, status = 'online') => {
    const { currentUser } = get();
    if (!currentUser.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status,
          status_message: statusMessage,
          status_emoticon: emoticon,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      set((state) => ({
        currentUser: {
          ...state.currentUser,
          status,
          statusMessage,
          statusEmoticon: emoticon,
        }
      }));
    } catch (err) {
      console.error('Erro ao salvar status pessoal:', err);
    }
  },

  updateProfile: async ({ name, username }) => {
    const { currentUser } = get();
    if (!currentUser.id) return;

    const updates: Record<string, string> = {};
    if (name) updates.name = name;
    if (username) updates.username = username;
    if (Object.keys(updates).length === 0) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Esse @username já está em uso! Escolha outro.');
        }
        throw error;
      }

      set((state) => ({
        currentUser: {
          ...state.currentUser,
          ...(name ? { name } : {}),
          ...(username ? { username } : {}),
        }
      }));
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      throw err;
    }
  },

  uploadAvatar: async (file: File) => {
    const { currentUser } = get();
    if (!currentUser.id) return;

    try {
      // 1. Fazer upload para o bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Atualizar tabela profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // 4. Atualizar estado local
      set((state) => ({
        currentUser: {
          ...state.currentUser,
          avatarUrl: publicUrl,
        }
      }));
    } catch (err) {
      console.error('Erro ao fazer upload da foto:', err);
      throw err;
    }
  },

  subscribeToRealtime: (userId) => {
    if (contactsChannel) contactsChannel.unsubscribe();
    if (profilesChannel) profilesChannel.unsubscribe();
    if (groupMembersChannel) groupMembersChannel.unsubscribe();

    // 1. Ouvir alterações na tabela de contatos (novos amigos ou aceitações)
    contactsChannel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, async (payload) => {
        const record = payload.new as any || payload.old as any;
        if (record && (record.user_id === userId || record.contact_id === userId)) {
          const list = await fetchContactsList(userId);
          set({ contacts: [GEMINI_BOT_CONTACT, ...list] });
        }
      })
      .subscribe();

    // 2. Ouvir alterações de perfil (status, emoticon, nome de exibição de amigos)
    profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const record = payload.new as any;
        if (!record) return;

        if (record.id === userId) {
          set((state) => ({
            currentUser: {
              ...state.currentUser,
              name: record.name,
              avatarUrl: record.avatar_url || state.currentUser.avatarUrl,
              status: record.status as ContactStatus,
              statusMessage: record.status_message || '',
              statusEmoticon: record.status_emoticon || '😊',
            }
          }));
        }

        set((state) => {
          const oldContact = state.contacts.find(c => c.id === record.id);
          
          // Se era offline (ou null) e agora ficou online, toca som
          if (oldContact && oldContact.status === 'offline' && record.status === 'online' && record.id !== userId) {
            setTimeout(() => get().addOnlineToast(record.name), 100);
          }

          const mapped = state.contacts.map(c => {
            if (c.id === record.id) {
              return {
                ...c,
                name: record.name,
                avatarUrl: record.avatar_url || c.avatarUrl,
                status: record.status as ContactStatus,
                statusMessage: record.status_message || '',
                statusEmoticon: record.status_emoticon || '😊',
              };
            }
            return c;
          });
          return { contacts: mapped };
        });
      })
      .subscribe();

    // 3. Ouvir quando o usuário é adicionado a um novo grupo
    groupMembersChannel = supabase
      .channel('group-members-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members' }, async (payload) => {
        const record = payload.new as any;
        if (record?.user_id === userId) {
          await get().fetchGroups(userId);
        }
      })
      .subscribe();

    return () => {
      if (contactsChannel) contactsChannel.unsubscribe();
      if (profilesChannel) profilesChannel.unsubscribe();
      if (groupMembersChannel) groupMembersChannel.unsubscribe();
    };
  },

  fetchMessages: async (userId, friendId) => {
    if (friendId === 'gemini-bot') {
      set({ messages: get().geminiSession });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const contacts = get().contacts;
      const friendName = contacts.find(c => c.id === friendId)?.name || 'Contato';

      const mapped: Message[] = (data || []).map(m => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_id === userId ? 'Você' : friendName,
        type: m.type as MessageType,
        content: m.content || '',
        timestamp: new Date(m.created_at).getTime(),
      }));

      set({ messages: mapped });
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  },

  subscribeToMessages: (userId, activeContactId) => {
    if (messagesChannel) {
      messagesChannel.unsubscribe();
      messagesChannel = null;
    }

    // Nome único por sessão para evitar reutilização de canal já subscrito
    const channelName = `messages-changes-${Date.now()}`;
    messagesChannel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any;
        if (!newMsg) return;

        const isCurrentChat = (newMsg.sender_id === userId && newMsg.receiver_id === activeContactId) ||
                              (newMsg.sender_id === activeContactId && newMsg.receiver_id === userId);

        if (isCurrentChat) {
          const friendName = get().contacts.find(c => c.id === activeContactId)?.name || 'Contato';
          const mapped: Message = {
            id: newMsg.id,
            senderId: newMsg.sender_id,
            senderName: newMsg.sender_id === userId ? 'Você' : friendName,
            type: newMsg.type as MessageType,
            content: newMsg.content || '',
            timestamp: new Date(newMsg.created_at).getTime(),
          };

          // Efeito de tremor de tela recebido ao vivo
          if (newMsg.sender_id === activeContactId && newMsg.type === 'shake') {
            get().triggerShake();
          }

          set((state) => {
            if (state.messages.some(m => m.id === mapped.id)) return {};
            return { messages: [...state.messages, mapped] };
          });
        }
      })
      .subscribe();
  },

  sendDatabaseMessage: async (type, content) => {
    const { currentUser, activeContactId } = get();
    if (!currentUser.id || !activeContactId) return;

    if (activeContactId === 'gemini-bot') {
      // Fluxo Virtual Local
      const userMsg: Message = {
        id: `local-${Date.now()}`,
        senderId: currentUser.id,
        senderName: 'Você',
        type,
        content,
        timestamp: Date.now(),
      };

      const newSession = [...get().geminiSession, userMsg];
      set({ messages: newSession, geminiSession: newSession });

      if (type === 'text') {
         set({ isGeminiTyping: true });
         try {
           const geminiRes = await chatWithGemini(content);
           const botMsg: Message = {
             id: `gemini-${Date.now()}`,
             senderId: 'gemini-bot',
             senderName: 'Assistente Gemini',
             type: geminiRes.type === 'image' ? 'image' : 'text',
             content: geminiRes.content,
             timestamp: Date.now(),
           };
           const finalSession = [...get().geminiSession, botMsg];
           set({ messages: finalSession, geminiSession: finalSession });
         } finally {
           set({ isGeminiTyping: false });
         }
      } else if (type === 'shake') {
         setTimeout(() => get().triggerShake(), 1000); // Gemini revida o Nudge!
         const botMsg: Message = {
           id: `gemini-${Date.now()}`,
           senderId: 'gemini-bot',
           senderName: 'Assistente Gemini',
           type: 'shake',
           content: '',
           timestamp: Date.now() + 1000,
         };
         const finalSession = [...get().geminiSession, botMsg];
         set({ messages: finalSession, geminiSession: finalSession });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: activeContactId,
          type,
          content,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao enviar mensagem para o banco:', err);
    }
  },

  // ── Ações de Grupo ────────────────────────────────────────────────────────

  fetchGroups: async (userId) => {
    try {
      // 1. Busca os grupos em que o usuário é membro
      const { data: memberships, error: mError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (mError || !memberships || memberships.length === 0) {
        set({ groups: [] });
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // 2. Busca os dados dos grupos
      const { data: groupsData, error: gError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (gError || !groupsData) {
        set({ groups: [] });
        return;
      }

      // 3. Para cada grupo, busca membros + perfis
      const groupsWithMembers: Group[] = await Promise.all(
        groupsData.map(async (g) => {
          const { data: memberRows } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', g.id);

          const memberIds = (memberRows || []).map(m => m.user_id);

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, status')
            .in('id', memberIds);

          const groupMembers: GroupMember[] = (profiles || []).map(p => ({
            userId: p.id,
            name: p.name,
            avatarUrl: p.avatar_url || '',
            status: (p.status || 'offline') as ContactStatus,
          }));

          return {
            id: g.id,
            name: g.name,
            avatarUrl: g.avatar_url || '',
            createdBy: g.created_by,
            members: groupMembers,
          };
        })
      );

      set({ groups: groupsWithMembers });
    } catch (err) {
      console.error('Erro ao carregar grupos:', err);
    }
  },

  createGroup: async (name, memberIds) => {
    const { currentUser } = get();
    if (!currentUser.id) return;

    // 1. Cria o grupo
    const { data: group, error: gError } = await supabase
      .from('groups')
      .insert({ name, created_by: currentUser.id })
      .select()
      .single();

    if (gError || !group) {
      console.error('Erro ao criar grupo:', gError);
      throw gError;
    }

    // 2. Adiciona todos os membros (inclui o criador)
    const allMemberIds = [...new Set([currentUser.id, ...memberIds])];
    const { error: mError } = await supabase
      .from('group_members')
      .insert(allMemberIds.map(uid => ({ group_id: group.id, user_id: uid })));

    if (mError) {
      console.error('Erro ao adicionar membros:', mError);
      throw mError;
    }

    // 3. Atualiza a lista de grupos local
    await get().fetchGroups(currentUser.id);
  },

  setActiveGroup: async (id) => {
    set({ activeGroupId: id, activeContactId: null });

    const { groups, currentUser } = get();
    const group = groups.find(g => g.id === id);
    if (!group) return;

    // Carrega histórico de mensagens do grupo
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar mensagens do grupo:', error);
      return;
    }

    const mapped: Message[] = (data || []).map(m => {
      const member = group.members.find(mb => mb.userId === m.sender_id);
      const senderName = m.sender_id === currentUser.id
        ? 'Você'
        : (member?.name || 'Membro');
      return {
        id: m.id,
        senderId: m.sender_id,
        senderName,
        type: m.type as MessageType,
        content: m.content || '',
        timestamp: new Date(m.created_at).getTime(),
      };
    });

    set({ groupMessages: mapped });
    get().subscribeToGroupMessages(id);
  },

  sendGroupMessage: async (type, content) => {
    const { currentUser, activeGroupId } = get();
    if (!currentUser.id || !activeGroupId) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: activeGroupId,
          sender_id: currentUser.id,
          type,
          content,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao enviar mensagem de grupo:', err);
    }
  },

  subscribeToGroupMessages: (groupId) => {
    if (groupMessagesChannel) {
      groupMessagesChannel.unsubscribe();
      groupMessagesChannel = null;
    }

    const channelName = `group-messages-${groupId}-${Date.now()}`;
    groupMessagesChannel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        if (!newMsg || newMsg.group_id !== groupId) return;

        const { groups, currentUser } = get();
        const group = groups.find(g => g.id === groupId);
        const member = group?.members.find(m => m.userId === newMsg.sender_id);
        const senderName = newMsg.sender_id === currentUser.id
          ? 'Você'
          : (member?.name || 'Membro');

        const mapped: Message = {
          id: newMsg.id,
          senderId: newMsg.sender_id,
          senderName,
          type: newMsg.type as MessageType,
          content: newMsg.content || '',
          timestamp: new Date(newMsg.created_at).getTime(),
        };

        if (newMsg.type === 'shake') {
          get().triggerShake();
        }

        set((state) => {
          if (state.groupMessages.some(m => m.id === mapped.id)) return {};
          return { groupMessages: [...state.groupMessages, mapped] };
        });
      })
      .subscribe();
  },

  // ── Relacionamentos ───────────────────────────────────────────────────────

  acceptContactRequest: async (relationId) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: 'accepted' })
        .eq('id', relationId);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao aceitar contato:', err);
    }
  },

  declineContactRequest: async (relationId) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', relationId);

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao recusar/remover contato:', err);
    }
  },
}));
