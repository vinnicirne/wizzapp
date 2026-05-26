export type ProfileStatus = 'online' | 'away' | 'busy' | 'offline';

export interface Profile {
  id: string; // UUID correspondente ao auth.users(id)
  email: string;
  username: string; // Nome de usuário único sem caracteres especiais (@username)
  name: string; // Nome de exibição público
  avatar_url?: string | null; // URL da imagem de perfil hospedada
  status: ProfileStatus; // Status de presença do MSN
  status_message?: string; // Frase personalizada de status
  status_emoticon?: string; // Emoticon animado selecionado
  invite_code?: string | null; // Código VIP gerado para convite
  created_at?: string; // Data de criação no formato ISO
}
