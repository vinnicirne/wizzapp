import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) throw new Error('API Key do Gemini não configurada.');
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
};

// Palavras-chave que indicam pedido de geração de imagem
const IMAGE_KEYWORDS = [
  'gera', 'gerar', 'cria', 'criar', 'desenha', 'desenhar',
  'faça', 'faz', 'mostra', 'mostrar', 'ilustra', 'ilustrar',
  'generate', 'create', 'draw', 'make', 'imagem', 'image',
  'foto', 'picture', 'ilustração', 'arte',
];

export const isImageRequest = (prompt: string): boolean => {
  const lower = prompt.toLowerCase();
  return IMAGE_KEYWORDS.some(kw => lower.includes(kw));
};

export interface GeminiResponse {
  type: 'text' | 'image';
  content: string; // text ou data URL base64 para imagem
}

// Modelos de geração de imagem em ordem de preferência
const IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-2.0-flash',
];

export const chatWithGemini = async (prompt: string): Promise<GeminiResponse> => {
  const client = getAI();

  // Se o usuário pediu uma imagem, tenta cada modelo disponível
  if (isImageRequest(prompt)) {
    for (const model of IMAGE_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        // Procura pela parte de imagem na resposta
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            return { type: 'image', content: dataUrl };
          }
        }

        // Modelo respondeu mas sem imagem — retorna texto da resposta
        const text = response.text;
        if (text) return { type: 'text', content: text };

      } catch (err: unknown) {
        console.warn(`Modelo ${model} falhou para imagem:`, err);
        // Continua para o próximo modelo
      }
    }

    // Todos os modelos falharam — responde em texto com gemini-2.5-flash
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `O usuário pediu para gerar uma imagem de: "${prompt}". Explique de forma simpática que no momento a geração de imagens não está disponível, mas descreva detalhadamente como seria essa imagem em 2-3 frases.`,
      });
      return { type: 'text', content: response.text || 'Não foi possível gerar a imagem no momento.' };
    } catch {
      return { type: 'text', content: 'Geração de imagens indisponível no momento. Tente novamente mais tarde.' };
    }
  }

  // Resposta normal de texto com gemini-2.5-flash
  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return { type: 'text', content: response.text || 'Desculpe, não consegui processar a resposta.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Erro na API do Gemini:', err);
    return { type: 'text', content: `Erro de comunicação com o assistente: ${msg}` };
  }
};
