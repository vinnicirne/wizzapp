import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';

interface Props {
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<Props> = ({ onClose }) => {
  const { currentUser, uploadAvatar } = useAppStore();
  const updateProfile = useAppStore(s => s.updateProfile);

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username ?? '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser.avatarUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('A foto deve ter no máximo 5 MB.'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) { setError('O nome não pode estar vazio.'); return; }
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername && cleanUsername.length < 3) { setError('O @username deve ter no mínimo 3 caracteres.'); return; }

    setLoading(true);
    try {
      if (selectedFile) await uploadAvatar(selectedFile);
      await updateProfile({ name: name.trim(), username: cleanUsername || undefined });
      setSuccess('Perfil atualizado com sucesso! ✅');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#ECF5FC] border border-[#8BADC4] shadow-2xl w-[380px] font-['Tahoma'] text-[13px] select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#1B5FAA] to-[#3A91E8] flex items-center justify-between px-2 py-1 rounded-t-sm">
          <div className="flex items-center gap-2">
            <img src="/wizz-icon.png" className="w-4 h-4" onError={e => (e.currentTarget.style.display='none')} />
            <span className="text-white text-[12px] font-bold">Configurações do Perfil</span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-4 bg-[#E08A8A] border border-[#C55A5A] hover:bg-[#D46060] text-white rounded-sm text-[10px] font-bold flex items-center justify-center"
          >×</button>
        </div>

        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-24 h-24 bg-white border-2 border-[#8BADC4] shadow-md cursor-pointer hover:border-[#3A91E8] transition-colors relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
              title="Clique para trocar a foto"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1B5FAA&color=fff&size=96`}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-end justify-center pb-1 transition-all">
                <span className="text-white text-[9px] font-bold bg-black/50 px-1 rounded opacity-0 hover:opacity-100">
                  📷 Trocar
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-[#1B5FAA] hover:underline font-bold"
            >
              📷 Alterar foto do perfil
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#3E5C76]">Nome de exibição:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              className="border border-[#8BADC4] bg-white px-2 py-1 text-[13px] outline-none focus:border-[#3A91E8] shadow-inner"
              placeholder="Como você quer ser visto"
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#3E5C76]">@username:</label>
            <div className="flex items-center border border-[#8BADC4] bg-white shadow-inner focus-within:border-[#3A91E8]">
              <span className="text-[#5A7A99] font-bold pl-2 pr-0.5 select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={30}
                className="flex-1 px-1 py-1 text-[13px] outline-none bg-transparent"
                placeholder="seu_username"
              />
            </div>
            <span className="text-[10px] text-[#5A7A99]">Apenas letras minúsculas, números e _</span>
          </div>

          {/* Email (read-only) */}
          {currentUser.email && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#3E5C76]">E-mail (não editável):</label>
              <div className="border border-[#8BADC4] bg-[#E0ECF7] px-2 py-1 text-[12px] text-[#5A7A99] select-all">
                {currentUser.email}
              </div>
            </div>
          )}

          {/* Notificações */}
          <div className="flex items-center gap-2 mt-2 bg-[#F2F8FD] border border-[#C5DAEC] px-2 py-2">
            <input
              type="checkbox"
              id="mute-online"
              checked={useAppStore(s => s.muteOnlineSound)}
              onChange={(e) => useAppStore.getState().setMuteOnlineSound(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="mute-online" className="text-[11px] font-bold text-[#3E5C76] cursor-pointer select-none">
              Silenciar som de contatos que ficam online
            </label>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-[#FFF4CC] border border-[#E8C400] px-3 py-2 text-[12px] text-[#6B5000] flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-[#D6F0D6] border border-[#5CB85C] px-3 py-2 text-[12px] text-[#2D6A2D]">
              {success}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-1 border-t border-[#C5DAEC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-[#ECF5FC] border border-[#8BADC4] text-[#3E5C76] hover:bg-[#D6E9F8] text-[12px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-1 bg-gradient-to-b from-[#3A91E8] to-[#1B5FAA] text-white border border-[#1B5FAA] text-[12px] font-bold hover:from-[#4AA0F0] hover:to-[#2570CC] disabled:opacity-60"
            >
              {loading ? 'Salvando...' : '✔ Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
