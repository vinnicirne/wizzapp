import React, { useEffect } from 'react';
import { useAppStore } from '../store';

export const OnlineToasts: React.FC = () => {
  const { onlineToasts, removeOnlineToast } = useAppStore();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {onlineToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeOnlineToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: { id: string; name: string }; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 5000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div className="w-[200px] bg-gradient-to-b from-[#F2F8FD] to-[#DFF0FA] border border-[#8BADC4] shadow-lg rounded-sm p-2 flex items-start gap-2 animate-slide-up pointer-events-auto">
      <div className="w-16 h-16 md:w-12 md:h-12 md:w-8 md:h-8 flex-shrink-0 bg-white border border-[#A0C0DB] rounded-sm p-0.5 relative">
        <div className="w-full h-full bg-[#E8F2F9] flex items-center justify-center">
          <span className="text-[18px] md:text-[14px]">👤</span>
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#22C55E] w-3 h-3 rounded-full border border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] md:text-[11px] font-bold text-[#091F41] truncate">{toast.name}</div>
        <div className="text-[18px] md:text-[14px] md:text-[10px] text-[#4A6E8A]">acabou de entrar.</div>
      </div>
    </div>
  );
};
