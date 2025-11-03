

import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { encode } from '../utils/helpers';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A more robust app would handle this gracefully, maybe disabling AI features.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const TEXT_CHAT_SYSTEM_INSTRUCTION = `You are NestMate, a friendly and helpful AI assistant for new parents.
Your goal is to provide supportive, evidence-based advice based on the provided context about the baby.
- Use the context about the baby's age, feeding, and sleep schedule to personalize your answers.
- If the user asks a general question, you can use Google Search to find up-to-date information.
- CRITICAL: Do not provide medical diagnoses or advice for medical emergencies.
- If a question seems like a medical emergency (e.g., "baby is not breathing," "high fever"), you MUST advise the user to contact a healthcare professional or emergency services immediately.
- Keep your answers concise, empathetic, and easy to understand.`;

export const generateTextWithGoogleSearch = async (prompt: string, context: string) => {
  try {
    const fullPrompt = `${context}\n\nQuestion: ${prompt}`;
    console.log('[geminiService] Sending prompt to Gemini:', { prompt, context });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: TEXT_CHAT_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ?.filter(chunk => chunk.web)
      .map(chunk => ({
        uri: chunk.web.uri,
        title: chunk.web.title
      }));

    console.log('[geminiService] Received response from Gemini:', { text: response.text, sources });
    return {
        text: response.text,
        sources: sources || []
    };
  } catch (error) {
    console.error("[geminiService] Error generating text with Google Search:", error);
    return {
        text: "Sorry, I encountered an error. Please try again.",
        sources: []
    };
  }
};


export const connectToLiveAPI = (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => Promise<void>;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
// FIX: The LiveSession type is not exported from the @google/genai library.
// Use ReturnType<typeof ai.live.connect> to infer the return type of the connect method.
}): ReturnType<typeof ai.live.connect> => {
    console.log('[geminiService] Connecting to Live API...');
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: `You are NestMate, a friendly and helpful AI assistant for new parents. 
            Provide supportive, evidence-based advice. Do not provide medical diagnoses. 
            If a question is about a medical emergency, advise the user to contact a healthcare professional immediately.
            Keep your answers concise and conversational.`
        },
    });
};

export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}