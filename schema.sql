-- 1. Tabela de Perfis
-- Esta tabela guarda os dados visuais do usuário e o seu status no estilo MSN
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE, -- Nome de usuario global unico
  name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_message TEXT DEFAULT '',
  status_emoticon TEXT DEFAULT '😊',
  invite_code TEXT UNIQUE, -- O código VIP exclusivo para convidar outros
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar Realtime para vermos quando alguém fica online/muda a mensagem de status
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 2. Tabela de Relacionamentos (Lista de Contatos)
-- Controla quem adicionou quem e o status da solicitação
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL, -- Dono da lista
  contact_id UUID REFERENCES profiles(id) NOT NULL, -- Contato adicionado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, contact_id) -- Não permite duplicar o mesmo contato
);

ALTER PUBLICATION supabase_realtime ADD TABLE contacts;

-- 3. Tabela de Mensagens
-- Guarda o histórico e os tremores de tela/áudio
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'nudge', 'knock', 'sound', 'audio', 'shake')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =========================================================================
-- POLITICAS DE SEGURANÇA (Row Level Security - RLS)
-- Para garantir que ninguém leia mensagens alheias
-- =========================================================================

-- Profiles: Qualquer usuário autenticado pode ler (para ver os amigos),
-- mas só o próprio dono pode atualizar seu status/nome.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Contacts: Você só pode ver e alterar sua própria lista de contatos
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own contacts" 
  ON contacts FOR SELECT USING (auth.uid() = user_id OR auth.uid() = contact_id);

CREATE POLICY "Users can insert contacts" 
  ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their contacts" 
  ON contacts FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = contact_id);

-- Messages: Só sender e receiver podem ver a mensagem
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" 
  ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" 
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
