


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage } from '@google/genai';
import { ChatMessage } from '../types';
import { generateTextWithGoogleSearch, connectToLiveAPI, createPcmBlob } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/helpers';
import { AIIcon } from './icons/AIIcon';

interface AIAssistantProps {
    onClose: () => void;
    babyContext: string;
}

enum LiveState {
    IDLE,
    CONNECTING,
    LISTENING,
    SPEAKING,
    ERROR
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, babyContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [liveState, setLiveState] = useState<LiveState>(LiveState.IDLE);

    // FIX: The LiveSession type is not exported from @google/genai.
    // The type is inferred from the return type of the connectToLiveAPI function.
    const sessionPromiseRef = useRef<ReturnType<typeof connectToLiveAPI> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const response = await generateTextWithGoogleSearch(input, babyContext);
        
        const modelMessage: ChatMessage = { role: 'model', text: response.text, sources: response.sources };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    const stopLiveSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        setLiveState(LiveState.IDLE);
    }, []);

    const handleLiveToggle = async () => {
        if (liveState !== LiveState.IDLE) {
            stopLiveSession();
            return;
        }

        setLiveState(LiveState.CONNECTING);
        setMessages(prev => [...prev, {role: 'model', text: 'Connecting to live assistant...'}]);

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch(err) {
            console.error("Microphone permission denied", err);
            setMessages(prev => [...prev, {role: 'model', text: 'Microphone access is required for voice chat.'}]);
            setLiveState(LiveState.ERROR);
            return;
        }
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;

        const callbacks = {
            onopen: async () => {
                setLiveState(LiveState.LISTENING);
                setMessages(prev => [...prev, {role: 'model', text: 'I\'m listening...'}]);
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                
                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    if (sessionPromiseRef.current) {
                      sessionPromiseRef.current.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                      });
                    }
                };
                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                const text = message.serverContent?.outputTranscription?.text || message.serverContent?.inputTranscription?.text;
                if(text) {
                    // Simple transcription display for now
                    console.log("Transcription:", text);
                }

                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && audioContextRef.current) {
                    setLiveState(LiveState.SPEAKING);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                    const sourceNode = audioContextRef.current.createBufferSource();
                    sourceNode.buffer = audioBuffer;
                    sourceNode.connect(audioContextRef.current.destination);
                    sourceNode.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(sourceNode);
                    sourceNode.onended = () => {
                        sourcesRef.current.delete(sourceNode);
                        if(sourcesRef.current.size === 0) {
                            setLiveState(LiveState.LISTENING);
                        }
                    };
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Live API Error:', e);
                setMessages(prev => [...prev, {role: 'model', text: 'An error occurred with the voice assistant.'}]);
                setLiveState(LiveState.ERROR);
                stopLiveSession();
            },
            onclose: (e: CloseEvent) => {
                console.log('Live API Closed');
                stopLiveSession();
            },
        };
        
        sessionPromiseRef.current = connectToLiveAPI(callbacks);
    };

    useEffect(() => {
        return () => {
           stopLiveSession();
        };
    }, [stopLiveSession]);
    
    const getMicButtonState = () => {
        switch (liveState) {
            case LiveState.IDLE:
                return { text: "Start Voice Chat", color: "bg-blue-500", animate: false };
            case LiveState.CONNECTING:
                return { text: "Connecting...", color: "bg-yellow-500", animate: true };
            case LiveState.LISTENING:
                return { text: "Stop Voice Chat", color: "bg-red-500", animate: true };
            case LiveState.SPEAKING:
                return { text: "Stop Voice Chat", color: "bg-red-500", animate: false };
            case LiveState.ERROR:
                return { text: "Error - Retry?", color: "bg-gray-500", animate: false };
            default:
                return { text: "Start Voice Chat", color: "bg-blue-500", animate: false };
        }
    }
    const micButtonState = getMicButtonState();

    return (
        <div className="fixed inset-0 bg-light-bg dark:bg-dark-bg z-50 flex flex-col">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <AIIcon className="w-6 h-6 text-brand-purple" />
                    <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">NestMate Assistant</h2>
                </div>
                <button onClick={onClose} className="text-light-text-secondary dark:text-dark-text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-3 ${msg.role === 'user' ? 'bg-brand-purple text-white rounded-br-none' : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-bl-none'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                    <h4 className="text-xs font-semibold mb-1">Sources:</h4>
                                    <ul className="text-xs space-y-1">
                                        {msg.sources.map((source, i) => (
                                            <li key={i}>
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 break-all">
                                                    {source.title || source.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-3 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-brand-purple rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-brand-purple rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-brand-purple rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                 <button 
                    onClick={handleLiveToggle} 
                    disabled={liveState === LiveState.CONNECTING}
                    className={`w-full text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors ${micButtonState.color}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mr-2 ${micButtonState.animate ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {micButtonState.text}
                </button>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Or type a message..."
                        className="flex-1 p-3 bg-light-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple text-light-text dark:text-dark-text"
                        disabled={liveState !== LiveState.IDLE}
                    />
                    <button onClick={handleSend} disabled={isLoading || liveState !== LiveState.IDLE} className="bg-brand-purple text-white p-3 rounded-lg disabled:bg-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                </div>
            </footer>
        </div>
    );
};