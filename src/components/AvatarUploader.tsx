import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { useAppStore } from '../store';
import { getCroppedImg } from '../lib/cropImage';

interface AvatarUploaderProps {
  onClose: () => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ onClose }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const uploadAvatar = useAppStore(state => state.uploadAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      await uploadAvatar(croppedFile);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao processar imagem.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#E8F2F9] border border-[#8BADC4] shadow-2xl rounded-t-lg w-full max-w-sm flex flex-col font-['Tahoma'] text-[13px] overflow-hidden">
        
        {/* Barra de Título */}
        <div className="bg-gradient-to-b from-[#C4E0F9] to-[#98C2E5] px-2 py-1.5 flex items-center gap-2 border-b border-[#8BADC4]">
          <span className="font-semibold text-[#091F41] flex-1 text-sm drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
            Alterar Foto de Perfil
          </span>
          <button 
            onClick={onClose}
            className="w-6 h-5 bg-[#E08A8A] border border-[#C55A5A] hover:bg-[#D46060] text-white rounded-sm text-xs font-bold shadow-inner flex items-center justify-center leading-none pb-0.5"
          >
            ×
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 bg-white">
          {!imageSrc ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-[#3E5C76] text-center">Selecione uma imagem do seu computador.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] hover:from-[#E8F2F9] hover:to-[#CDE0EF] font-bold text-[#091F41]"
              >
                Procurar Imagem...
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-[250px] bg-gray-900 rounded border border-[#8BADC4] overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="rect"
                  showGrid={false}
                />
              </div>
              
              <div className="flex items-center gap-2 px-2">
                <span className="text-[11px] text-[#3E5C76] font-bold">Zoom:</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>

              {errorMsg && (
                <div className="text-center text-[#B05C00] bg-[#FFF4E5] border border-[#F5C277] p-2 text-[11px] font-bold rounded-sm">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => setImageSrc(null)} 
                  className="px-4 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] hover:from-[#E8F2F9] hover:to-[#CDE0EF]"
                >
                  Voltar
                </button>
                <button 
                  disabled={loading} 
                  onClick={handleSave} 
                  className="px-4 py-1.5 border border-[#8BADC4] rounded bg-gradient-to-b from-[#F7FBFC] to-[#DCEAF4] hover:from-[#E8F2F9] hover:to-[#CDE0EF] font-bold text-[#091F41] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar e Usar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string), false);
    reader.readAsDataURL(file);
  });
}
