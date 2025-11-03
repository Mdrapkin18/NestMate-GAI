
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";
import { encode } from '../utils/helpers';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A more robust app would handle this gracefully, maybe disabling AI features.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateTextWithGoogleSearch = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
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

    return {
        text: response.text,
        sources: sources || []
    };
  } catch (error) {
    console.error("Error generating text with Google Search:", error);
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
}): Promise<LiveSession> => {
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
