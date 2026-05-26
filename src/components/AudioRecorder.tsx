import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
  onSendAudio: (audioUrl: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSendAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-1 text-xs px-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        <span className="text-red-700">Gravando...</span>
        <button onClick={stopRecording} className="px-2 py-0.5 ml-1 bg-[#DCEAF4] border border-[#8BADC4] hover:bg-[#C1D6E8] text-[#3E5C76] rounded-sm shadow-sm cursor-pointer">
          Parar
        </button>
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className="flex items-center gap-1 px-1">
        <audio src={audioUrl} controls className="h-6 w-32" />
        <button onClick={() => { onSendAudio(audioUrl); setAudioUrl(null); }} className="px-2 py-0.5 bg-[#DCEAF4] border border-[#8BADC4] hover:bg-[#C1D6E8] text-[#3E5C76] text-xs rounded-sm cursor-pointer shadow-sm">
          Enviar
        </button>
        <button onClick={() => setAudioUrl(null)} className="px-2 py-0.5 bg-[#F4DCEC] border border-[#C48BAD] hover:bg-[#E8C1D6] text-[#763E5C] text-xs rounded-sm cursor-pointer shadow-sm">
          Descartar
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={startRecording}
      className="px-2 py-1 hover:bg-[#D5E6F2] hover:border-[#A0C0DB] border border-transparent rounded text-xs flex items-center gap-1 text-[#3E5C76]"
      title="Gravar Mensagem de Voz"
    >
      <span className="text-base">🎤</span> Voz
    </button>
  );
};
