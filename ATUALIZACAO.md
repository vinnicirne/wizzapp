# Log de Atualizações: WizzApp (msnplus)

Este log acompanha de forma cronológica reversa (das atualizações mais recentes para as mais antigas) as versões, alterações estruturais de sistema, otimizações e correções do projeto.

---

## [v1.2.0] - 2026-05-26

### Integração Real-Time com Supabase
* **Sincronização de Amizades Bidirecional:** A lista de contatos do Zustand foi totalmente acoplada à tabela `contacts` do Supabase. Ações para buscar e adicionar contatos por e-mail ou @username único global foram disponibilizadas na interface.
* **Solicitações Pendentes e Convites:** Adicionadas duas novas seções colapsáveis na interface do MSN (`ContactList.tsx`):
  * **Solicitações Pendentes (Recebidas):** Permite aceitar (✓) ou recusar (×) convites recebidos de forma ágil, com persistência direta no banco de dados.
  * **Convites Enviados:** Lista as pessoas adicionadas pelo usuário que ainda não responderam ao convite, permitindo o cancelamento manual a qualquer momento.
* **Status e Presença Dinâmica:** Acoplado o editor de mensagem pessoal e humor (`StatusEditor.tsx`) para atualizar a tabela `profiles` no Supabase. Modificações são refletidas aos amigos instantaneamente usando canais de realtime do Supabase.
* **Mensagens e Winks no Banco de Dados:** O envio de mensagens de texto, de áudio, de winks retro (shaking, knocks e sons) foi conectado à tabela `messages`. Novas mensagens são ouvidas em tempo real para sincronização da tela de chat ativa.

### Correções Críticas
* **Correção no Esquema do Perfil:** Identificada a ausência da coluna `username` na tabela `profiles` no Supabase. Atualizado o arquivo `schema.sql` e fornecida a instrução SQL corretiva para execução direta no editor de consultas do Supabase.

---

## [v1.1.0] - 2026-05-26

### Mudanças Estruturais e Memória de Sistema
* **Institucionalização do Gabarito Adapta:** Criação do arquivo `GABARITO.md` contendo as diretrizes de estilo, de higiene comunicativa (remoção de preâmbulos e travessões) e as dez regras operacionais de comportamento.
* **Mapeamento de Gatilhos de Memória:** Criação do arquivo `GATILHO.md` estabelecendo os comandos automatizados "gabarito" e "atualização" para redefinição dinâmica de contexto de atuação do agente.
* **Domínio de Dados (Contratos de Dados Primeiro):** Início da definição das entidades de domínio (`Profile`, `Contact` e `Message`) sob a pasta `src/entities/` para integração direta com TypeScript e Supabase.

---

## [v1.0.0] - 2026-05-26 (Release Inicial da Interface)

### Recursos de Interface e UX Retrô
* **Design Clássico MSN:** Interface inspirada nos moldes clássicos do Windows Live Messenger/MSN usando fonte `Tahoma` e coloração azul gradiente.
* **Ações de Chat Interativas (Winks):**
  * **Nudge (Chamar Atenção):** Disparo de vibração nativa via Capacitor Haptics e piscar de borda amarela na janela.
  * **Shake (Tremer Tela):** Tremor mecânico na janela com flash amarelo translúcido na tela e som de tremor clássico.
  * **Knock (Bater na Tela):** Animação 3D de punho com tremor no nó raiz (`#root`) e som correspondente.
* **Mensagens de Voz:** Gravador nativo integrado usando `MediaRecorder` com suporte a reprodução imediata.
* **Emoticons e Status:** Seletor de emoticons clássicos e editor de mensagem de status pessoal com previews interativos.

### Arquitetura de Software Inicial
* **Framework principal:** React 19 + TypeScript + Vite.
* **Estilização:** Tailwind CSS v4 com extensões de animações personalizadas para tremores e batidas.
* **Gerenciamento de Estado:** Zustand para gerenciamento de contatos e mensagens simulados.
* **Autenticação:** Integração inicial com Supabase Auth e fluxo VIP com validação de código `WIZZ-`.
