import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // LOGIN
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        // REGISTRO VIP
        if (!inviteCode.startsWith('WIZZ-')) {
          throw new Error('Código de convite inválido! O WizzApp é uma rede exclusiva.');
        }

        // 1. Validar se o convite existe e de quem é
        const { data: inviterData, error: inviterError } = await supabase
          .from('profiles')
          .select('id')
          .eq('invite_code', inviteCode)
          .single();

        if (inviterError || !inviterData) {
          throw new Error('Código de convite não encontrado ou inválido.');
        }

        const inviterId = inviterData.id;
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          // Gerar um NOVO código de convite para este usuário
          const newInviteCode = 'WIZZ-' + Math.random().toString(36).substring(2, 8).toUpperCase();

          // Cria o perfil na tabela 'profiles' após criar o usuário
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            name: name,
            status: 'online',
            status_message: 'Acabei de entrar no WizzApp!',
            invite_code: newInviteCode
          });
          
          if (profileError) {
             throw new Error('Esse @usuário já está em uso! Escolha outro.');
          }

          // Adicionar um ao outro na lista de contatos automaticamente (status 'accepted')
          await supabase.from('contacts').insert([
            { user_id: inviterId, contact_id: data.user.id, status: 'accepted' },
          ]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] h-screen font-['Tahoma'] p-4">
      
      {/* Container Principal Estilo Janela Windows */}
      <div className="w-full max-w-sm bg-[#F0F6FA] border border-[#8BADC4] rounded-t-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Barra de Título */}
        <div className="bg-gradient-to-b from-[#A5CBEB] to-[#7AAED9] px-2 py-1.5 flex items-center gap-2 border-b border-[#8BADC4]">
           <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7.5" fill="#2272A8" />
            <circle cx="8" cy="6"  r="3"   fill="white" opacity="0.9" />
            <path d="M2 14 Q2 9 8 9 Q14 9 14 14" fill="white" opacity="0.9" />
          </svg>
          <span className="font-bold text-[#091F41] flex-1 text-[13px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
            WizzApp Messenger
          </span>
        </div>

        {/* Corpo do Login */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Avatar / Logo Gigante */}
          <div className="w-24 h-24 bg-gradient-to-br from-[#E8F2F9] to-[#C4E0F9] border-2 border-[#8BADC4] rounded-md shadow-inner flex items-center justify-center mb-6 relative group">
            <svg 
              width="60" 
              height="60" 
              viewBox="0 0 64 64" 
              className={loading ? 'anim-spin' : ''}
              style={{ transformOrigin: 'center' }}
            >
              <circle cx="32" cy="24" r="13" fill="#2272A8" />
              <path d="M12 56 Q12 36 32 36 Q52 36 52 56 Z" fill="#2272A8" />
            </svg>
          </div>

          {error && (
            <div className="w-full text-center text-[#B05C00] bg-[#FFF4E5] border border-[#F5C277] p-2 text-[11px] font-bold mb-4 rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="w-full flex flex-col gap-3">
            {!isLogin && (
              <>
                <div>
                  <label className="text-[11px] text-[#3E5C76] font-bold block mb-0.5">Como quer ser chamado (Nome de exibição)?</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border border-[#A0C0DB] px-2 py-1 text-sm outline-none focus:border-[#4A90D9] shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#3E5C76] font-bold block mb-0.5">Nome de Usuário Único (@username):</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-white border border-[#A0C0DB] px-2 py-1 text-sm outline-none focus:border-[#4A90D9] shadow-inner"
                    placeholder="ex: joao123"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] text-[#3E5C76] font-bold block mb-0.5">Endereço de e-mail:</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-[#A0C0DB] px-2 py-1 text-sm outline-none focus:border-[#4A90D9] shadow-inner"
                placeholder="exemplo@wizzapp.com"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#3E5C76] font-bold block mb-0.5">Senha:</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#A0C0DB] px-2 py-1 pr-8 text-sm outline-none focus:border-[#4A90D9] shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#2272A8] hover:text-[#091F41] font-bold"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-[11px] text-[#D97706] font-bold block mb-0.5 flex items-center gap-1">
                  ⭐ Código de Convite VIP:
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#FFFBEB] border border-[#FCD34D] px-2 py-1 text-sm outline-none focus:border-[#F59E0B] shadow-inner font-mono text-center tracking-widest uppercase"
                  placeholder="WIZZ-XXXXXX"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex flex-col gap-1 mt-1 text-[11px] text-[#091F41]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-3 h-3" /> Lembrar meu ID e senha
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-3 h-3" /> Entrar automaticamente
                </label>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[11px] text-[#2272A8] hover:underline"
              >
                {isLogin ? 'Obter uma nova conta VIP' : 'Já tenho conta VIP'}
              </button>
              
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] hover:from-[#E8F2F9] hover:to-[#CDE0EF] active:bg-[#C1D6E8] shadow-sm font-bold text-[#091F41] disabled:opacity-50"
              >
                {loading ? 'Entrando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
              </button>
            </div>
          </form>

        </div>
        
        {/* Rodapé da Janela */}
        <div className="bg-[#DFF0FA] border-t border-[#8BADC4] px-4 py-2 text-center text-[10px] text-[#5A7A99]">
          WizzApp Messenger Plus! Edition
        </div>
      </div>
    </div>
  );
};
