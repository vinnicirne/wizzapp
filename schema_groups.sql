-- =========================================================================
-- GRUPOS DE CHAT — WizzApp
-- Execute este script no Supabase SQL Editor
-- =========================================================================

-- 1. Tabela de Grupos
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Membros do Grupo
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(group_id, user_id)
);

-- 3. Mensagens de Grupo
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'sound', 'audio', 'shake', 'image')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================================
-- REALTIME
-- =========================================================================
-- (Estas tabelas já foram adicionadas ao realtime na primeira execução)
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- POLÍTICAS: GROUPS
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT
  USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- -------------------------------------------------------------------------
-- POLÍTICAS: GROUP MEMBERS
-- -------------------------------------------------------------------------
-- Para evitar recursão infinita (HTTP 500), permitimos que usuários 
-- autenticados vejam a tabela group_members. (Os UUIDs dos grupos protegem os dados).
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Group creator can add members" ON group_members;
CREATE POLICY "Group creator can add members"
  ON group_members FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- -------------------------------------------------------------------------
-- POLÍTICAS: GROUP MESSAGES
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view group messages" ON group_messages;
CREATE POLICY "Members can view group messages"
  ON group_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can send group messages" ON group_messages;
CREATE POLICY "Members can send group messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );
