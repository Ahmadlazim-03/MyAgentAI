'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '@/contexts/ai-context';
import { useTheme } from '@/contexts/theme-context';
import { Brain } from 'lucide-react';

// Import types
import { Message } from '../types/chat';

// Import custom hooks
import { useResearch } from '../hooks/useResearch';

// Import components
import { MessageBubble } from './chat/MessageBubble';
import { InputArea } from './chat/InputArea';
import { ResearchSidebar } from './research/ResearchSidebar';
import { ResearchTypingIndicator } from './research/ResearchTypingIndicator';

// Import utilities
import { parseAIResponseForTitles } from '../utils/aiParser';
import { extractLinksFromContent } from '../utils/markdown';

export const AIChat: React.FC = () => {
  const { state, sendMessage } = useAI();
  const { } = useTheme();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Research hook
  const {
    isResearchMode,
    setIsResearchMode,
    researchStep,
    setResearchStep,
    setTitleSuggestions,
    selectedTitleId,
    setSelectedTitleId,
    isResearchTyping,
    setIsResearchTyping,
    switchToResearchMode,
    handleTitleSelection,
    generateResearchTitles
  } = useResearch();

  // Initial welcome message
  const welcomeText = [
    '👋 Halo! Saya asisten AI yang siap membantu kapan pun.',
    '',
    '### Kemampuan utama',
    '',
    '- 💬 Chat & Analisis — menjawab pertanyaan dan memberi penjelasan',
    '- 🌐 Buka Website — contoh: `arahkan ke google.com`',
    '- 💻 Format Kode — pewarnaan sintaks otomatis',
    '- 🖼️ Analisis Gambar — klik ikon gambar untuk mengunggah',
    '- 📚 **Research Assistant** — bantuan penelitian akademik lengkap',
    '',
    '**Fitur Research Assistant:**',
    '- 📝 Rekomendasi judul penelitian',
    '- 📄 Pencarian jurnal Scopus/SINTA',
    '- 🔍 Analisis konten jurnal',
    '- 📋 Manajemen referensi',
    '- ✍️ Bantuan penulisan bab',
    '',
    '### Mode Research Assistant',
    'Ketik **"Mulai penelitian"** untuk menggunakan mode khusus penelitian akademik.',
    '',
    'Apa yang ingin Anda lakukan hari ini? 🚀'
  ].join('\n');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: welcomeText,
      isAI: true,
      timestamp: new Date(),
      suggestions: ['Mulai penelitian', 'Buatkan kode HTML', 'Arahkan ke google.com', 'Jelaskan tentang AI']
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Voice input handlers
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser Anda tidak mendukung speech recognition');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) return;
      
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'id-ID';

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      alert('Terjadi error pada speech recognition');
    }
  };

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isAI) {
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(lastMessage.content);
        utterance.lang = 'id-ID';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } else {
      alert('Browser Anda tidak mendukung text-to-speech');
    }
  };

  // Listen for new AI responses
  useEffect(() => {
    if (state.responses && state.responses.length > 0) {
      const latestResponse = state.responses[state.responses.length - 1];
      
      // Enhanced detection for research mode responses with title suggestions
      const hasResearchTitles = isResearchMode && researchStep === 'title' && (
        latestResponse.text.includes('judul penelitian') || 
        latestResponse.text.includes('rekomendasi') ||
        latestResponse.text.includes('opsi penelitian') ||
        latestResponse.text.includes('riset') ||
        latestResponse.text.includes('fokus') ||
        /\d+\.\s*[A-Z].*(?:analisis|implementasi|pengembangan|pengaruh|hubungan|perancangan|evaluasi|studi|kajian|optimasi|pemanfaatan|penerapan)/i.test(latestResponse.text) ||
        /berdasarkan.*buatkan/i.test(latestResponse.text)
      );
      
      if (hasResearchTitles) {
        // Try to parse AI response for research titles
        const suggestedTitles = parseAIResponseForTitles(latestResponse.text);
        
        if (suggestedTitles.length > 0) {
          // Create a message with only research title suggestions (no AI text)
          const titleSuggestionsMessage: Message = {
            id: Date.now().toString(),
            content: `🎯 **Pilihan Judul Penelitian**

Pilih salah satu judul penelitian di bawah ini untuk melanjutkan ke tahap pencarian jurnal:`,
            isAI: true,
            timestamp: new Date(),
            suggestions: ['Cari judul lain', 'Ganti bidang penelitian', 'Kembali ke chat biasa'],
            researchData: {
              type: 'title_suggestions',
              data: suggestedTitles
            }
          };
          
          setMessages(prev => [...prev, titleSuggestionsMessage]);
          setIsTyping(false);
          setIsResearchTyping(false);
          return;
        }
      }
      
      // For non-research responses, show normal AI message
      const extractedLinks = extractLinksFromContent(latestResponse.text);
      const newMessage: Message = {
        id: Date.now().toString(),
        content: latestResponse.text,
        isAI: true,
        timestamp: new Date(),
        suggestions: latestResponse.suggestions,
        links: extractedLinks.length > 0 ? extractedLinks : undefined
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      setIsResearchTyping(false);
    }
  }, [state.responses, isResearchMode, researchStep, setIsResearchTyping]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedImages.length === 0) || state.isProcessing) return;

    const lowerInput = inputValue.toLowerCase();
    
    // Handle research flow based on current step
    if (isResearchMode && researchStep === 'initial') {
      // Check if user has a title already
      if (lowerInput.includes('sudah punya judul') || lowerInput.includes('judul saya')) {
        const titleMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `✅ **Bagus! Silakan masukkan judul penelitian Anda.**

Format yang direkomendasikan:
- Pastikan judul spesifik dan fokus
- Gunakan kata kunci yang jelas
- Maksimal 20-25 kata

Contoh: *"Implementasi Machine Learning untuk Prediksi Tingkat Kepuasan Pelanggan E-Commerce di Indonesia"*

Ketik judul penelitian Anda di bawah ini:`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Contoh judul AI', 'Contoh judul ekonomi', 'Bantuan menulis judul']
        };
        
        setMessages(prev => [...prev, titleMessage]);
        setResearchStep('title-input');
        setInputValue('');
        setAttachedImages([]);
        return;
      }
      
      // Generate titles based on field/background
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        isAI: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      setInputValue('');
      setAttachedImages([]);
      
      // Now generate research titles based on user's field/background
      await generateResearchTitles(inputValue, inputValue, sendMessage);
      return;
    }

    // Handle when user provides their own title
    if (isResearchMode && researchStep === 'title-input') {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        isAI: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      const confirmMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `✅ **Judul penelitian diterima!**

**Judul:** "${inputValue}"

**🔍 Langkah 2: Pencarian Referensi Jurnal**

Sekarang saya akan mencari jurnal-jurnal berkualitas yang relevan dengan judul penelitian Anda:

🎯 **Kriteria Jurnal:**
- Terindeks Scopus (Q1-Q4) dan SINTA (1-5)
- Relevan dengan topik penelitian
- Publikasi terbaru (2019-2024)
- Impact factor tinggi

Memulai pencarian jurnal...`,
        isAI: true,
        timestamp: new Date(),
        suggestions: ['Lanjutkan pencarian jurnal', 'Ubah judul penelitian', 'Bantuan lainnya']
      };
      
      setMessages(prev => [...prev, confirmMessage]);
      setResearchStep('journals');
      setInputValue('');
      setAttachedImages([]);
      return;
    }

    // Regular message flow
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date(),
      images: attachedImages.length > 0 ? attachedImages : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      await sendMessage(inputValue, attachedImages);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }

    setInputValue('');
    setAttachedImages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Special handling for "Mulai penelitian" to prevent immediate title generation
    if (suggestion.toLowerCase() === 'mulai penelitian') {
      switchToResearchMode();
      setResearchStep('initial');
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: suggestion,
        isAI: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Add instruction message
      const instructionMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `🔬 **Selamat datang di Research Assistant!**

Saya akan membantu Anda dalam proses penelitian akademik dari awal hingga selesai.

**📝 Langkah 1: Tentukan Bidang/Latar Belakang Penelitian**

Silakan ceritakan:
- Bidang studi yang ingin diteliti
- Latar belakang atau topik yang menarik bagi Anda
- Area spesifik yang ingin difokuskan

**Contoh input:**
- "Saya tertarik meneliti dampak AI terhadap pendidikan"
- "Bidang teknik informatika, fokus machine learning"
- "Penelitian ekonomi tentang e-commerce di Indonesia"
- "Psikologi pendidikan dan metode pembelajaran"

Atau jika sudah punya judul, ketik: **"Saya sudah punya judul: [judul penelitian Anda]"**`,
        isAI: true,
        timestamp: new Date(),
        suggestions: [
          'Bidang AI dan teknologi', 
          'Ekonomi dan bisnis', 
          'Pendidikan dan pembelajaran',
          'Psikologi dan sosial',
          'Teknik informatika',
          'Saya sudah punya judul'
        ]
      };
      setMessages(prev => [...prev, instructionMessage]);
      return;
    }
    
    // For other suggestions, use normal flow
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleExitResearchMode = () => {
    setIsResearchMode(false);
    setResearchStep('initial');
    setTitleSuggestions([]);
    setSelectedTitleId(null);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Research Sidebar */}
      <ResearchSidebar
        isResearchMode={isResearchMode}
        researchStep={researchStep}
        onExitResearchMode={handleExitResearchMode}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Advanced AI Assistant</h1>
                <p className="text-sm text-gray-600">
                  {isResearchMode ? 'Research Assistant - Step: title' : 'Code • Themes • Websites • Research'}
                </p>
              </div>
            </div>
            {isResearchMode && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Research Mode
              </div>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 flex flex-col px-6 md:px-10 lg:px-16 py-6 w-full overflow-y-auto">
          <div className="flex-1 space-y-6">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onTitleSelection={handleTitleSelection}
                onSuggestionClick={handleSuggestionClick}
                selectedTitleId={selectedTitleId}
              />
            ))}

            {/* Research Typing Indicator */}
            {isResearchTyping && <ResearchTypingIndicator />}

            {/* Regular Typing Indicator */}
            {isTyping && !isResearchTyping && (
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
        </div>

        {/* Input Area */}
        <InputArea
          inputValue={inputValue}
          setInputValue={setInputValue}
          attachedImages={attachedImages}
          setAttachedImages={setAttachedImages}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          isProcessing={state.isProcessing}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onVoiceInput={handleVoiceInput}
          onTextToSpeech={handleTextToSpeech}
        />
      </div>
    </div>
  );
};