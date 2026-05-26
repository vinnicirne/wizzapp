export type ContactRelationStatus = 'pending' | 'accepted' | 'blocked';

export interface Contact {
  id: string; // UUID chave primária do relacionamento
  user_id: string; // UUID do usuário proprietário da lista de contatos
  contact_id: string; // UUID do usuário adicionado à lista
  status: ContactRelationStatus; // Estado da solicitação de amizade
  created_at?: string; // Data de criação no formato ISO
}
