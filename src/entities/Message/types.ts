export type MessageType = 'text' | 'nudge' | 'knock' | 'sound' | 'audio' | 'shake';

export interface Message {
  id: string; // UUID chave primária da mensagem
  sender_id: string; // UUID do usuário remetente
  receiver_id: string; // UUID do usuário destinatário
  type: MessageType; // Tipo da mensagem/interação
  content?: string | null; // Conteúdo textual, link de áudio ou tipo de som
  created_at?: string; // Data de criação no formato ISO
}
