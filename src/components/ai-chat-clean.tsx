'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '@/contexts/ai-context';
import { useTheme } from '@/contexts/theme-context';
import { 
  Send, 
  Brain, 
  User, 
  Loader, 
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Image as ImageIcon
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import NextImage from 'next/image';

// Minimal SpeechRecognition types (browser specific)
type SRResultItem = { transcript: string };
type SRResult = { [index: number]: SRResultItem };
export interface SpeechRecognitionEventLike { results: { [index: number]: SRResult } }
export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: unknown) => void) | null;
}
export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  suggestions?: string[];
  formattedContent?: React.ReactNode;
}

export const AIChat: React.FC = () => {
  const { state, sendMessage, trackBehavior, cancelCurrent } = useAI();
  const { applyTheme } = useTheme();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<{isListening: boolean; isSupported: boolean; recognition: SpeechRecognitionInstance | null}>(
    {
      isListening: false,
      isSupported: false,
      recognition: null
    }
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize voice features
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const W = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
      const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'id-ID';
        
        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setVoiceState(prev => ({ ...prev, isListening: false }));
        };
        
        recognition.onerror = () => {
          setVoiceState(prev => ({ ...prev, isListening: false }));
        };
        
        setVoiceState({
          isListening: false,
          isSupported: true,
          recognition
        });
      }
      
      // Speech Synthesis
      if (window.speechSynthesis) {
        setSpeechSynthesis(window.speechSynthesis);
      }
    }
  }, []);

  // Format AI responses with markdown (no typography plugin required)
  const formatMessage = React.useCallback((content: string): React.ReactNode => {
    const components = {
      code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : 'text';
        const isInline = !className;
        if (!isInline) {
          return (
            <div className="my-3 rounded-lg overflow-hidden border border-gray-700 bg-[#0f172a]">
              <div className="bg-[#0b1220] px-4 py-2 flex justify-between items-center">
                <span className="text-gray-300 text-sm font-mono">{language}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(String(children))}
                  className="text-gray-400 hover:text-white text-sm"
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, fontSize: '14px', background: 'transparent' }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          );
        }
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        );
      },
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="mb-3 leading-relaxed text-gray-700">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-3 ml-4 space-y-1">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-3 ml-4 space-y-1">{children}</ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="leading-relaxed text-gray-700">{children}</li>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-lg font-bold mb-2 text-gray-900">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-base font-bold mb-2 text-gray-900">{children}</h3>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-gray-900">{children}</strong>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="pl-4 my-3 italic py-2 rounded-r" style={{ borderLeft: '4px solid var(--primary-color)', backgroundColor: 'var(--primary-light)' }}>
          {children}
        </blockquote>
      ),
  } as unknown as import('react-markdown').Components;
    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }, []);

  // Initial welcome message (clean markdown without visible asterisks)
  const welcomeText = [
    '👋 Halo! Saya asisten AI yang siap membantu kapan pun.',
    '',
    '### Kemampuan utama',
    '',
    '- 💬 Chat & Analisis — menjawab pertanyaan dan memberi penjelasan',
    '- 🌐 Buka Website — contoh: `arahkan ke google.com`',
    '- 💻 Format Kode — pewarnaan sintaks otomatis',
    '- 🖼️ Analisis Gambar — klik ikon gambar untuk mengunggah',
    '- 🎤 Voice Input — tekan tombol mikrofon',
    '',
    'Siap membantu — apa yang ingin Anda lakukan sekarang?'
  ].join('\n');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: welcomeText,
      isAI: true,
      timestamp: new Date(),
      suggestions: ['Buatkan kode HTML', 'Arahkan ke google.com', 'Jelaskan tentang AI'],
      formattedContent: null as unknown as React.ReactNode
    }
  ]);

  // Hydrate formatted content for the initial message after formatter is ready
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      if (first.formattedContent) return prev; // already formatted
      const formatted = formatMessage(first.content);
      const updated = [{ ...first, formattedContent: formatted }, ...prev.slice(1)];
      return updated;
    });
  }, [formatMessage]);

  // Voice functions
  const startListening = () => {
    if (voiceState.recognition && voiceState.isSupported) {
      setVoiceState(prev => ({ ...prev, isListening: true }));
      voiceState.recognition.start();
    }
  };

  const stopListening = () => {
    if (voiceState.recognition) {
      voiceState.recognition.stop();
      setVoiceState(prev => ({ ...prev, isListening: false }));
    }
  };

  const speakText = React.useCallback((text: string) => {
    if (speechSynthesis && !isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  }, [speechSynthesis, isSpeaking]);

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Listen for new AI responses
  useEffect(() => {
    if (state.responses.length > 0) {
      const latestResponse = state.responses[state.responses.length - 1];
      const formattedContent = formatMessage(latestResponse.text);
      
      const newMessage: Message = {
        id: Date.now().toString(),
        content: latestResponse.text,
        isAI: true,
        timestamp: new Date(),
        suggestions: latestResponse.suggestions,
        formattedContent
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }
  }, [state.responses, formatMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || state.isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Handle special commands
    const lowerInput = inputValue.toLowerCase();
    
    // Theme commands (Bahasa/English)
    const allowedColors = [
      'biru','blue','gelap','hitam','black','dark','terang','putih','white','light',
      'merah','red','hijau','green','kuning','yellow','ungu','purple',
      'pink','orange','indigo','teal','gray','abu','abu-abu','pelangi','rainbow','warna-warni','warni'
    ];

    const colorSuggestions = [
      'Tema biru', 'Tema hijau', 'Tema merah', 'Tema ungu', 'Tema kuning', 
      'Tema gelap', 'Tema terang', 'Tema pelangi'
    ];

    const emitThemeChanged = (color: string) => {
      applyTheme(color);
      const themeMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `✨ **Tema berhasil diubah ke ${color}!**\n\nTema baru telah diterapkan. Bagaimana menurut Anda?`,
        isAI: true,
        timestamp: new Date(),
        suggestions: [...colorSuggestions, 'Kembali ke tema biru', 'Coba tema hijau', 'Sempurna!']
      };
      setMessages(prev => [...prev, themeMessage]);
      setInputValue('');
    };

    // English helpers
  const englishMap: Record<string,string> = { 'blue':'biru','green':'hijau','red':'merah','purple':'ungu','yellow':'kuning','dark':'dark','gelap':'dark','light':'light','terang':'light','black':'dark','white':'light','rainbow':'rainbow','pelangi':'rainbow','indigo':'indigo','teal':'teal','orange':'orange','pink':'pink','gray':'gray' };

    // Pattern 1: sentences like "rubah/ubah/ganti tema menjadi hijau" or "change/set theme to purple"
    if (/(rubah|ubah|ganti)\s+tema|ganti\s+warna|change\s+theme|set\s+theme/i.test(lowerInput)) {
      const colorMatch = lowerInput.match(/(?:menjadi|to|ke|become|set\s+to)\s+([a-zA-Z-]+)/);
      if (colorMatch) {
        const col = colorMatch[1];
        emitThemeChanged(englishMap[col] || col);
        return;
      }
    }

    // Pattern 2: "tema merah" / "warna hijau" / "theme blue"
    const themeWordMatch = lowerInput.match(/^(?:tema|warna|theme|color)\s+([a-zA-Z-]+)[.!?]?$/);
    if (themeWordMatch) {
      const col = themeWordMatch[1];
      emitThemeChanged(englishMap[col] || col);
      return;
    }

    // Pattern 3: single color word
    const plain = lowerInput.replace(/\s+/g,' ').trim().replace(/[.!?]$/,'');
    if (allowedColors.includes(plain)) {
      emitThemeChanged(englishMap[plain] || plain);
      return;
    }
    
    // Website redirect commands
    if (lowerInput.includes('arahkan') || lowerInput.includes('redirect') || lowerInput.includes('buka') || lowerInput.includes('go to') || lowerInput.includes('kunjungi')) {
      let url = '';
      
      if (lowerInput.includes('google')) {
        url = 'https://google.com';
      } else if (lowerInput.includes('youtube')) {
        url = 'https://youtube.com';
      } else if (lowerInput.includes('facebook')) {
        url = 'https://facebook.com';
      } else if (lowerInput.includes('instagram')) {
        url = 'https://instagram.com';
      } else if (lowerInput.includes('github')) {
        url = 'https://github.com';
      } else {
        const urlMatch = inputValue.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(com|org|net|edu|gov|id|co\.id)[^\s]*)/i);
        if (urlMatch) {
          url = urlMatch[0];
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
        }
      }
      
      if (url) {
        const redirectMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `🌐 **Mengarahkan ke ${url}**\\n\\nSedang membuka website dalam tab baru...`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Buka website lain', 'Kembali ke chat', 'Arahkan ke youtube']
        };
        
        setMessages(prev => [...prev, redirectMessage]);
        
        setTimeout(() => {
          window.open(url, '_blank');
        }, 1500);
        
        setInputValue('');
        return;
      }
    }
    
    setInputValue('');
    setIsTyping(true);

    trackBehavior({
      type: 'chat_message',
      message: inputValue,
      timestamp: Date.now()
    });

    try {
      await sendMessage(inputValue);
    } catch (e) {
      console.warn('Request aborted or failed', e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // If suggestion implies theme change (supports EN/ID), apply immediately
    const s = suggestion.toLowerCase();

    // Handle acknowledgement shortcuts without sending to AI
    if (['sempurna!', 'mantap', 'perfect!', 'great!'].includes(s)) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 3).toString(),
        content: '👍 Baik, dicatat.',
        isAI: true,
        timestamp: new Date(),
      }]);
      return;
    }

    const themeRegexes = [
      /(rubah|ubah|ganti)\s+tema\s+(menjadi\s+)?([a-z-]+)/,
      /ganti\s+warna\s+(menjadi\s+)?([a-z-]+)/,
      /change\s+theme\s+(to\s+)?([a-z-]+)/,
      /set\s+theme\s+(to\s+)?([a-z-]+)/,
      /^(tema|warna|theme|color)\s+([a-z-]+)$/,
      /^coba\s+tema\s+([a-z-]+)$/,
      /^kembali\s+ke\s+tema\s+([a-z-]+)$/,
      /^try\s+the\s+([a-z-]+)\s+theme$/,
      /^back\s+to\s+the\s+([a-z-]+)\s+theme$/
    ];
    for (const r of themeRegexes) {
      const m = s.match(r);
      if (m) {
        const color = (m[3] || m[2] || m[1]) as string;
        if (color) {
          applyTheme(color);
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            content: `✨ Tema berhasil diubah ke ${color}!`,
            isAI: true,
            timestamp: new Date(),
            suggestions: ['Kembali ke tema biru','Coba tema hijau', 'Sempurna!', 'Tema merah', 'Tema ungu', 'Tema kuning', 'Tema gelap', 'Tema terang', 'Tema pelangi']
          }]);
          return;
        }
      }
    }

    setInputValue(suggestion);
    trackBehavior({
      type: 'suggestion_click',
      suggestion,
      timestamp: Date.now()
    });
  };

  // Cancel current request
  const cancelRequest = React.useCallback(() => {
    cancelCurrent();
    if (isTyping) setIsTyping(false);
  }, [cancelCurrent, isTyping]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRequest();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelRequest]);

  return (
  <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
  <div className="px-6 py-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center accent-gradient">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Advanced AI Assistant</h1>
                <p className="text-sm text-gray-600">
                  {state.isProcessing ? (
                    <span className="flex items-center">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Memproses permintaan Anda...
                    </span>
                  ) : (
                    'Voice • Code • Themes • Websites'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Voice Button */}
              <button
                onClick={voiceState.isListening ? stopListening : startListening}
                disabled={!voiceState.isSupported}
                className={`p-2 rounded-lg transition-colors ${
                  voiceState.isListening 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={voiceState.isListening ? 'Stop Listening' : 'Voice Input'}
              >
                {voiceState.isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              
              {/* Speech Button */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage && lastMessage.isAI) {
                      speakText(lastMessage.content.replace(/```[\\s\\S]*?```/g, 'code block').substring(0, 200));
                    }
                  }
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={isSpeaking ? 'Stop Speaking' : 'Speak Last Response'}
              >
                {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              {/* Refresh Button */}
              <button 
                onClick={() => window.location.reload()}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

  {/* Messages Container */}
  <div className="flex-1 px-6 py-6 space-y-6 w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex items-start space-x-3 max-w-4xl ${
              message.isAI ? '' : 'flex-row-reverse space-x-reverse'
            }`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.isAI 
                  ? 'accent-gradient' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}>
                {message.isAI ? (
                  <Brain className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`relative group rounded-2xl p-4 ${
                message.isAI
                  ? 'bg-[rgba(255,255,255,0.7)] backdrop-blur border border-gray-200 shadow-sm'
                  : 'accent-gradient text-white'
              }`}>
                {/* Copy Button */}
                <button
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md ${
                    message.isAI 
                      ? 'hover:bg-gray-100 text-gray-500' 
                      : 'hover:bg-white/20 text-white/70'
                  }`}
                  title="Copy message"
                >
                  <Copy className="h-4 w-4" />
                </button>

                {/* Content */}
                <div className="pr-8">
                  {message.formattedContent ? (
                    <div className={message.isAI ? '' : 'text-white'}>{message.formattedContent}</div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                </div>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Aksi cepat:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 text-xs rounded-full transition-colors accent-chip hover:opacity-90"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-2 ${
                  message.isAI ? 'text-gray-400' : 'text-white/70'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/90 backdrop-blur border-t border-gray-200 px-6 py-4 sticky bottom-0 z-10">
        <div className="flex items-center space-x-3 w-full">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan Anda di sini... Coba: 'Buatkan kode HTML', 'Arahkan ke google.com'"
              className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent text-gray-700 placeholder-gray-400"
              rows={1}
              style={{ 
                minHeight: '48px', 
                maxHeight: '120px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
            {attachedImage ? (
              <div className="mt-2 flex items-center space-x-3">
                <div className="w-12 h-12 relative">
                  <NextImage src={attachedImage} alt="attachment" fill className="object-cover rounded-md border" />
                </div>
                <button
                  onClick={() => setAttachedImage(null)}
                  className="text-xs px-2 py-1 rounded border text-gray-600 hover:bg-gray-100"
                >
                  Hapus gambar
                </button>
              </div>
            ) : null}
          </div>
          {/* Image Upload */}
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  setAttachedImage(result);
                };
                reader.readAsDataURL(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-12 w-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors flex items-center justify-center"
              title="Upload Gambar"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          </>
          {state.isProcessing ? (
            <button onClick={cancelRequest} className="flex-shrink-0 px-3 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
              Batalkan
            </button>
          ) : null}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || state.isProcessing}
            className="flex-shrink-0 text-white h-12 w-12 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg accent-gradient hover:opacity-90 flex items-center justify-center"
          >
            {state.isProcessing ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Tekan Esc untuk membatalkan permintaan yang berjalan.</p>
      </div>
    </div>
  );
};