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
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIAction {
  type: string;
  payload: Record<string, string | number | boolean>;
}

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  suggestions?: string[];
  actions?: AIAction[];
  image?: string;
  formattedContent?: React.ReactNode;
}

interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  recognition: any;
}

export const AIChat: React.FC = () => {
  const { state, sendMessage, trackBehavior } = useAI();
  const { applyTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your advanced AI assistant. I can:\n\n• 💬 Chat and analyze images\n• 🌐 Redirect you to any website\n• 🎨 Change themes with voice commands\n• 💻 Format code and create tables\n• 🎤 Support voice input/output\n\nWhat would you like me to help you with?',
      isAI: true,
      timestamp: new Date(),
      suggestions: [
        'Show me a code example',
        'Change theme to dark',
        'Go to google.com',
        'Create a table'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [lastSentMessage, setLastSentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSupported: false,
    recognition: null
  });
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize voice recognition and speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'id-ID'; // Indonesian
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setVoiceState(prev => ({ ...prev, isListening: false }));
          // Do NOT auto-send message - user should click send button manually
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
      
      // Initialize speech synthesis
      if (window.speechSynthesis) {
        setSpeechSynthesis(window.speechSynthesis);
      }
    }
  }, []);

  // Voice input functions
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

  // Copy functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const repeatLastMessage = () => {
    if (lastSentMessage.trim()) {
      setInputValue(lastSentMessage);
    }
  };

  // Text to speech function
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

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Format AI responses with markdown support
  const formatMessage = React.useCallback((content: string): React.ReactNode => {
    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom code block renderer
            code: ({ inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : 'text';
              
              if (!inline) {
                return (
                  <div className="my-4">
                    <div className="bg-gray-800 rounded-t-lg px-4 py-2 text-white text-sm font-mono flex justify-between items-center">
                      <span>{language}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(String(children))}
                        className="text-gray-300 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              
              return (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            },
            
            // Custom paragraph renderer
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed">{children}</p>
            ),
            
            // Custom list renderers
            ul: ({ children }) => (
              <ul className="mb-4 ml-6 space-y-1 list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-6 space-y-1 list-decimal">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            
            // Custom header renderers
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold mb-3 mt-4">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>
            ),
            
            // Custom strong (bold) renderer
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900">{children}</strong>
            ),
            
            // Custom blockquote renderer
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic bg-blue-50 py-2">
                {children}
              </blockquote>
            ),
            
            // Custom table renderers
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-300 px-4 py-2">{children}</td>
            ),
            
            // Custom horizontal rule
            hr: () => (
              <hr className="my-6 border-t border-gray-300" />
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        actions: latestResponse.actions,
        formattedContent
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      
      // Auto-speak disabled to prevent issues - users can manually click speaker button
      // if (speechSynthesis && !isSpeaking) {
      //   speakText(latestResponse.text.replace(/```[\s\S]*?```/g, 'code block').substring(0, 200));
      // }
    }
  }, [state.responses, speechSynthesis, isSpeaking, speakText, formatMessage]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || state.isProcessing) return;

    // Save last message for repeat functionality
    setLastSentMessage(inputValue);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date(),
      image: imagePreview
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Process special commands
    const lowerInput = inputValue.toLowerCase();
    
    // Theme change command
    if (lowerInput.includes('rubah tema') || lowerInput.includes('change theme') || lowerInput.includes('ganti warna')) {
      const colorMatch = lowerInput.match(/(?:menjadi|to|ke)\s+(\w+)/);
      if (colorMatch) {
        const color = colorMatch[1];
        applyTheme(color);
        
        const themeMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `✅ Tema berhasil diubah ke ${color}! Bagaimana menurut Anda?`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Kembali ke tema biru', 'Coba tema lain', 'Sempurna!']
        };
        
        setMessages(prev => [...prev, themeMessage]);
        setInputValue('');
        setSelectedImage(null);
        setImagePreview('');
        return;
      }
    }
    
    // Website redirect command - improved to handle any URL
    if (lowerInput.includes('arahkan') || lowerInput.includes('redirect') || lowerInput.includes('buka website') || lowerInput.includes('go to') || lowerInput.includes('kunjungi') || lowerInput.includes('visit')) {
      // Try to find URL pattern
      let urlMatch = inputValue.match(/https?:\/\/[^\s]+/);
      
      // If no protocol, try to find domain-like patterns
      if (!urlMatch) {
        const domainMatch = inputValue.match(/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/);
        if (domainMatch) {
          urlMatch = [`https://${domainMatch[0]}`];
        }
      }
      
      // Handle specific common sites without full URL
      if (!urlMatch) {
        if (lowerInput.includes('google')) {
          urlMatch = ['https://google.com'];
        } else if (lowerInput.includes('youtube')) {
          urlMatch = ['https://youtube.com'];
        } else if (lowerInput.includes('facebook')) {
          urlMatch = ['https://facebook.com'];
        } else if (lowerInput.includes('instagram')) {
          urlMatch = ['https://instagram.com'];
        } else if (lowerInput.includes('twitter')) {
          urlMatch = ['https://twitter.com'];
        } else if (lowerInput.includes('github')) {
          urlMatch = ['https://github.com'];
        }
      }
      
      if (urlMatch) {
        const url = urlMatch[0];
        
        const redirectMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `🌐 Mengarahkan Anda ke ${url}...`,
          isAI: true,
          timestamp: new Date(),
          actions: [{ type: 'redirect', payload: { url } }]
        };
        
        setMessages(prev => [...prev, redirectMessage]);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.open(url, '_blank');
        }, 2000);
        
        setInputValue('');
        setSelectedImage(null);
        setImagePreview('');
        return;
      }
    }
    
    setInputValue('');
    setSelectedImage(null);
    setImagePreview('');
    setIsTyping(true);

    // Track user interaction
    trackBehavior({
      type: 'chat_message',
      message: inputValue,
      hasImage: !!selectedImage,
      timestamp: Date.now()
    });

    // Send to AI with image if available
    let messageToSend = inputValue;
    if (selectedImage) {
      messageToSend += ' [Image uploaded for analysis]';
      // Send with image data
      await sendMessage(messageToSend, imagePreview);
    } else {
      await sendMessage(messageToSend);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: AIAction) => {
    trackBehavior({
      type: 'ai_action_click',
      action: action.type,
      timestamp: Date.now()
    });

    // Process the action
    switch (action.type) {
      case 'navigate':
        if (typeof action.payload.href === 'string') {
          window.location.href = action.payload.href;
        } else if (typeof action.payload.url === 'string') {
          window.location.href = action.payload.url;
        }
        break;
      case 'redirect':
        if (typeof action.payload.url === 'string') {
          window.open(action.payload.url, '_blank');
        }
        break;
      case 'create':
        console.log('Create action:', action.payload);
        break;
      case 'modify':
        console.log('Modify action:', action.payload);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{
      background: 'var(--bg-color, #f8fafc)',
      color: 'var(--text-color, #1f2937)'
    }}>
      {/* Header */}
      <div className="border-b p-4" style={{
        backgroundColor: 'var(--primary-light, #dbeafe)',
        borderBottomColor: 'var(--primary-color, #3b82f6)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{
              background: 'var(--primary-color, #3b82f6)'
            }}>
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Advanced AI Assistant</h1>
              <p className="text-sm opacity-70">
                {state.isProcessing ? 'Processing your request...' : 'Voice • Image • Code • Themes • Websites'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Voice Controls */}
            <button
              onClick={voiceState.isListening ? stopListening : startListening}
              disabled={!voiceState.isSupported}
              className={`p-2 rounded-lg transition-colors ${
                voiceState.isListening 
                  ? 'bg-red-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
              title={voiceState.isListening ? 'Stop Listening' : 'Start Voice Input'}
            >
              {voiceState.isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            
            {/* Speech Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  // Click to toggle speech, but don't auto-send messages
                  const lastMessage = messages[messages.length - 1];
                  if (lastMessage && lastMessage.isAI) {
                    speakText(lastMessage.content.replace(/```[\s\S]*?```/g, 'code block').substring(0, 200));
                  }
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                isSpeaking 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'hover:bg-gray-100'
              }`}
              title={isSpeaking ? 'Stop Speaking' : 'Speak Last AI Response'}
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            {/* Image Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Upload Image"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            {/* Copy Input Text */}
            <button
              onClick={() => copyToClipboard(inputValue)}
              disabled={!inputValue.trim()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Copy Input Text"
            >
              <Copy className="h-5 w-5" />
            </button>

            {/* Repeat Last Message */}
            <button
              onClick={repeatLastMessage}
              disabled={!lastSentMessage.trim()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Repeat Last Message"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => window.location.reload()}
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex items-start space-x-3 max-w-4xl ${message.isAI ? '' : 'flex-row-reverse space-x-reverse'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.isAI 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                  : 'bg-gray-500'
              }`}>
                {message.isAI ? (
                  <Brain className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`rounded-2xl px-4 py-3 relative group ${
                message.isAI
                  ? 'bg-white border border-gray-200 shadow-sm'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              }`}>
                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                    message.isAI 
                      ? 'hover:bg-gray-100 text-gray-600' 
                      : 'hover:bg-white/20 text-white/80'
                  }`}
                  title="Copy message"
                >
                  <Copy className="h-4 w-4" />
                </button>

                {/* Image Preview */}
                {message.image && (
                  <img src={message.image} alt="Uploaded" className="max-w-xs rounded-lg mb-2" />
                )}

                {/* Message Text */}
                {message.formattedContent ? (
                  <div className="text-sm">{message.formattedContent}</div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                
                {/* AI Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Quick actions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500">Available actions:</p>
                    <div className="space-y-1">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleActionClick(action)}
                          className="flex items-center w-full text-left px-3 py-2 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          {action.type}: {action.payload.url || action.payload.href || JSON.stringify(action.payload)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs opacity-50 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3 max-w-3xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t">
          <div className="flex items-center space-x-2">
            <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
            <span className="text-sm text-gray-600">Image ready to send</span>
            <button
              onClick={() => {
                setImagePreview('');
                setSelectedImage(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4" style={{
        backgroundColor: 'var(--primary-light, #dbeafe)',
        borderTopColor: 'var(--primary-color, #3b82f6)'
      }}>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything, upload an image, change themes, or visit websites..."
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !selectedImage) || state.isProcessing}
            className="flex-shrink-0 text-white p-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--primary-color, #3b82f6)'
            }}
          >
            {state.isProcessing ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
};