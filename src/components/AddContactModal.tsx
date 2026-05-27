import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AddContactModalProps {
  onClose: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<'input' | 'pending' | 'not_found' | 'invite_code'>('input');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdd = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setErrorMsg('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // 1. Busca o usuário por email ou username
      const queryValue = searchQuery.trim().toLowerCase();
      
      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('id, name, username')
        .or(`email.ilike.${queryValue},username.ilike.%${queryValue}%`)
        .limit(1);

      if (searchError) throw searchError;

      if (profiles && profiles.length > 0) {
        const contactId = profiles[0].id;
        
        if (contactId === user.id) {
          throw new Error('Você não pode adicionar a si mesmo!');
        }

        // 2. Insere na tabela de contatos
        const { error: insertError } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            contact_id: contactId,
            status: 'pending'
          });

        if (insertError) {
          if (insertError.code === '23505') {
             throw new Error('Este contato já está na sua lista ou você já enviou um convite.');
          }
          throw insertError;
        }

        setStep('pending');
      } else {
        // Não encontrou
        setStep('not_found');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = () => {
    // Gera um código único estilo VIP
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'WIZZ-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(code);
    setStep('invite_code');
  };

  const handleCopyInvite = () => {
    const text = `Fui selecionado para o WizzApp e tenho um convite exclusivo para você!\n\nBaixe o app e use o código VIP: ${inviteCode}`;
    navigator.clipboard.writeText(text);
    alert('Convite copiado para a área de transferência! Envie para seu amigo.');
    onClose();
  };

  return (
    <>
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        {/* Modal Clássico Windows */}
        <div className="bg-[#E8F2F9] border border-[#8BADC4] shadow-2xl rounded-t-lg w-full max-w-sm flex flex-col font-['Tahoma'] text-[13px] overflow-hidden">
          
          {/* Barra de Título */}
          <div className="bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] px-2 py-1.5 flex items-center gap-2 border-b border-[#8BADC4]">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7.5" fill="#2272A8" />
              <circle cx="8" cy="6"  r="3"   fill="white" opacity="0.9" />
              <path d="M2 14 Q2 9 8 9 Q14 9 14 14" fill="white" opacity="0.9" />
              <path d="M12 9 L12 13 M10 11 L14 11" stroke="#23B618" strokeWidth="2" />
            </svg>
            <span className="font-semibold text-[#091F41] flex-1 text-sm drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
              Adicionar um Contato
            </span>
            <button 
              onClick={onClose}
              className="w-6 h-5 bg-[#E08A8A] border border-[#C55A5A] hover:bg-[#D46060] text-white rounded-sm text-xs font-bold shadow-inner flex items-center justify-center leading-none pb-0.5"
            >
              ×
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4 bg-white">
            
            {step === 'input' && (
              <>
                <p className="text-[#091F41]">
                  Insira o endereço de e-mail ou o @username do seu contato para adicioná-lo à sua rede do WizzApp.
                </p>
                {errorMsg && (
                  <div className="w-full text-center text-[#B05C00] bg-[#FFF4E5] border border-[#F5C277] p-2 text-[15px] md:text-[11px] font-bold rounded-sm">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-[15px] md:text-[11px] font-bold text-[#3E5C76] mb-1">
                    E-mail ou Username:
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    className="w-full bg-white border border-[#A0C0DB] px-2 py-1.5 text-sm outline-none focus:border-[#4A90D9] shadow-inner"
                    placeholder="ex: vinnicirne ou email@exemplo.com"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={onClose} className="px-4 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] hover:from-[#E8F2F9] hover:to-[#CDE0EF]">
                    Cancelar
                  </button>
                  <button disabled={loading} onClick={handleAdd} className="px-4 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] hover:from-[#E8F2F9] hover:to-[#CDE0EF] font-bold text-[#091F41] disabled:opacity-50">
                    {loading ? 'Buscando...' : 'Avançar >'}
                  </button>
                </div>
              </>
            )}

            {step === 'pending' && (
              <div className="text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 md:w-12 md:h-12 bg-[#22C55E]/10 rounded-full flex items-center justify-center border border-[#22C55E]/30">
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-[#091F41] font-bold">Solicitação Enviada!</p>
                <p className="text-[#3E5C76] text-xs">
                  Você poderá enviar mensagens assim que <b>{searchQuery}</b> aceitar o seu convite.
                </p>
                <button onClick={onClose} className="mt-4 px-6 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] font-bold">
                  Concluir
                </button>
              </div>
            )}

            {step === 'not_found' && (
              <div className="flex flex-col gap-3">
                <div className="bg-[#FFF4E5] border border-[#F5C277] p-3 flex gap-3 text-[#B05C00]">
                  <span className="text-xl leading-none mt-0.5">⚠️</span>
                  <div className="text-xs">
                    <p className="font-bold mb-1">Usuário não encontrado.</p>
                    <p>O WizzApp é uma rede exclusiva e fechada. O contato <b>{searchQuery}</b> ainda não faz parte da comunidade.</p>
                  </div>
                </div>
                <p className="text-[#091F41] text-xs mt-2 text-center">
                  Como você é um membro, deseja gerar um código VIP para convidar essa pessoa?
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <button onClick={onClose} className="px-4 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4]">
                    Não, obrigado
                  </button>
                  <button onClick={handleGenerateInvite} className="px-4 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#FFF0D4] to-[#FAD48B] hover:from-[#FAD48B] hover:to-[#F5B445] font-bold text-[#733F00]">
                    Gerar Convite VIP ⭐
                  </button>
                </div>
              </div>
            )}

            {step === 'invite_code' && (
              <div className="flex flex-col gap-3 items-center text-center">
                <div className="w-16 h-16 md:w-12 md:h-12 bg-gradient-to-br from-[#FAD48B] to-[#F5B445] rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-2xl">⭐</span>
                </div>
                <p className="text-[#091F41] font-bold">Seu Convite VIP foi gerado!</p>
                <p className="text-[#3E5C76] text-xs px-2">
                  Envie este código único para seu amigo. Ao abrir o aplicativo pela primeira vez, ele precisará inserir este código para conseguir criar uma conta.
                </p>
                <div className="w-full bg-[#E8F2F9] border border-[#8BADC4] p-3 text-center mt-2 rounded-sm shadow-inner">
                  <span className="text-2xl font-mono font-bold text-[#091F41] tracking-widest select-all">
                    {inviteCode}
                  </span>
                </div>
                <button onClick={handleCopyInvite} className="w-full mt-2 px-4 py-2 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] hover:from-[#E8F2F9] hover:to-[#CDE0EF] font-bold text-[#091F41] flex items-center justify-center gap-2">
                  📋 Copiar Convite para a Área de Transferência
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};
