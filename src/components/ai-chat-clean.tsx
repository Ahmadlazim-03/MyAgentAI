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
  RotateCcw
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  suggestions?: string[];
  formattedContent?: React.ReactNode;
}

export const AIChat: React.FC = () => {
  const { state, sendMessage, trackBehavior } = useAI();
  const { applyTheme } = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '👋 Halo! Saya adalah AI Assistant canggih yang siap membantu Anda!\n\n**Kemampuan saya:**\n\n• 💬 **Chat & Analisis** - Menjawab pertanyaan dan diskusi\n• 🎨 **Ubah Tema** - "Rubah tema menjadi hijau"\n• 🌐 **Buka Website** - "Arahkan ke google.com"\n• 💻 **Format Kode** - Syntax highlighting otomatis\n• 🎤 **Voice Input** - Klik tombol mikrofon\n\n**Apa yang bisa saya bantu hari ini?**',
      isAI: true,
      timestamp: new Date(),
      suggestions: [
        'Buatkan kode HTML',
        'Rubah tema menjadi hijau', 
        'Arahkan ke google.com',
        'Jelaskan tentang AI'
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceState, setVoiceState] = useState({
    isListening: false,
    isSupported: false,
    recognition: null as any
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize voice features
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'id-ID';
        
        recognition.onresult = (event: any) => {
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
    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ className, children, ...props }: any) => {
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
                      customStyle={{ margin: 0, fontSize: '14px', background: '#0f172a' }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              
              return (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-pink-600" {...props}>
                  {children}
                </code>
              );
            },
            p: ({ children }) => (
              <p className="mb-3 leading-relaxed text-gray-700">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 ml-4 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 ml-4 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed text-gray-700">{children}</li>
            ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold mb-2 text-gray-900">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-bold mb-2 text-gray-900">{children}</h3>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">{children}</strong>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-400 pl-4 my-3 italic bg-blue-50 py-2 rounded-r">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }, []);

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
    if (
      /rubah\s+tema|ubah\s+tema|ganti\s+warna|change\s+theme|set\s+theme/.test(lowerInput)
    ) {
      const colorMatch = lowerInput.match(/(?:menjadi|to|ke|become|set\s+to)\s+([a-zA-Z]+)/);
      if (colorMatch) {
        const color = colorMatch[1];
        applyTheme(color);
        
        const themeMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `✨ **Tema berhasil diubah ke ${color}!**\n\nTema baru telah diterapkan. Bagaimana menurut Anda?`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Kembali ke tema biru', 'Coba tema hijau', 'Tema merah', 'Sempurna!']
        };
        
        setMessages(prev => [...prev, themeMessage]);
        setInputValue('');
        return;
      }
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

    // Track user interaction
    trackBehavior({
      type: 'chat_message',
      message: inputValue,
      timestamp: Date.now()
    });

    await sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    trackBehavior({
      type: 'suggestion_click',
      suggestion,
      timestamp: Date.now()
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-6xl mx-auto w-full">
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
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
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
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
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
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
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
      <div className="bg-white/90 backdrop-blur border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-3 max-w-6xl mx-auto">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan Anda di sini... Coba: 'Buatkan kode HTML', 'Rubah tema menjadi hijau', 'Arahkan ke google.com'"
              className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              rows={1}
              style={{ 
                minHeight: '48px', 
                maxHeight: '120px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || state.isProcessing}
            className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 shadow-lg"
          >
            {state.isProcessing ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};