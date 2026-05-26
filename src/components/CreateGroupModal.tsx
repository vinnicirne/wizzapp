import React, { useState } from 'react';
import { useAppStore } from '../store';

interface Props {
  onClose: () => void;
}

export const CreateGroupModal: React.FC<Props> = ({ onClose }) => {
  const { contacts, createGroup } = useAppStore();
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const acceptedContacts = contacts.filter(
    c => c.relationStatus === 'accepted' && c.id !== 'gemini-bot'
  );

  const toggleContact = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Digite um nome para o grupo.'); return; }
    if (selected.length < 1) { setError('Selecione ao menos 1 contato.'); return; }
    setLoading(true);
    setError('');
    try {
      await createGroup(groupName.trim(), selected);
      onClose();
    } catch {
      setError('Erro ao criar grupo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Modal — estilo janela MSN */}
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-[#ECF5FC] border border-[#8BADC4] shadow-2xl flex flex-col font-['Tahoma'] text-[12px]">

        {/* Barra de título */}
        <div className="bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] px-2 py-1.5 flex items-center gap-2 border-b border-[#8BADC4]">
          <span className="text-base leading-none select-none">👥</span>
          <span className="font-bold text-[#091F41] flex-1 text-[11px]">Criar Novo Grupo</span>
          <button
            onClick={onClose}
            className="w-5 h-4 bg-[#E08A8A] border border-[#C55A5A] hover:bg-[#D46060] text-white rounded-sm text-[10px] font-bold flex items-center justify-center leading-none"
          >×</button>
        </div>

        <div className="p-3 flex flex-col gap-3">

          {/* Nome do grupo */}
          <div>
            <label className="text-[11px] font-bold text-[#3E5C76] block mb-1">
              Nome do Grupo:
            </label>
            <input
              autoFocus
              type="text"
              value={groupName}
              onChange={e => { setGroupName(e.target.value); setError(''); }}
              placeholder="Ex: Amigos do trabalho..."
              maxLength={40}
              className="w-full border border-[#8BADC4] bg-white px-2 py-1 text-[12px] outline-none focus:border-[#4A90D9] shadow-inner font-['Tahoma']"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {/* Lista de contatos para selecionar */}
          <div>
            <label className="text-[11px] font-bold text-[#3E5C76] block mb-1">
              Selecionar Membros{selected.length > 0 ? ` (${selected.length} selecionado${selected.length !== 1 ? 's' : ''})` : ':'}
            </label>
            <div className="border border-[#8BADC4] bg-white max-h-48 overflow-y-auto shadow-inner">
              {acceptedContacts.length === 0 ? (
                <div className="text-center text-[11px] text-[#999] py-4 italic px-2">
                  Você precisa ter contatos aceitos para criar um grupo.
                </div>
              ) : (
                acceptedContacts.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-[#F0F0F0] last:border-0 transition-colors select-none ${
                      selected.includes(c.id) ? 'bg-[#C8DFEF]' : 'hover:bg-[#E8F2F9]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleContact(c.id)}
                      className="w-3 h-3 accent-[#2272A8] flex-shrink-0"
                    />
                    {/* Avatar */}
                    <div className="w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 border border-[#8BADC4]">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#3A8FCC] flex items-center justify-center text-white text-[9px] font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#091F41] truncate text-[11px]">{c.name}</div>
                      {c.statusMessage && (
                        <div className="text-[9px] text-[#5A7A99] truncate italic">{c.statusMessage}</div>
                      )}
                    </div>
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      c.status === 'online' ? 'bg-green-500' :
                      c.status === 'away'   ? 'bg-yellow-400' :
                      c.status === 'busy'   ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="text-[11px] text-red-700 font-bold bg-red-50 border border-red-300 px-2 py-1 rounded-sm">
              ⚠ {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-1 border-t border-[#D0E4F0]">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-1 bg-[#ECF5FC] border border-[#8BADC4] hover:bg-[#D5E6F2] text-[#3E5C76] text-[11px] font-bold rounded-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !groupName.trim() || selected.length === 0}
              className="px-4 py-1 bg-gradient-to-b from-[#4A90D9] to-[#2272A8] text-white text-[11px] font-bold hover:from-[#5A9FE9] hover:to-[#3282B8] disabled:opacity-40 disabled:cursor-not-allowed rounded-sm shadow-sm"
            >
              {loading ? 'Criando...' : '✓ Criar Grupo'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
