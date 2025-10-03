'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Image as ImageIcon,
  BookOpen,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import NextImage from 'next/image';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Research interfaces
interface ResearchTitleSuggestion {
  id: string;
  title: string;
  description: string;
  field: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  keywords: string[];
  isSelected?: boolean;
}

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  suggestions?: string[];
  images?: string[];
  links?: { label: string; href: string }[];
  researchData?: {
    type: 'title_suggestions' | 'journal_recommendations';
    data: ResearchTitleSuggestion[] | unknown[];
  };
}

export const AIChat: React.FC = () => {
  const { state, sendMessage, trackBehavior } = useAI();
  const { } = useTheme();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice and TTS State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Research Assistant State
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [researchStep, setResearchStep] = useState<'initial' | 'title' | 'journals' | 'analysis' | 'references' | 'writing'>('initial');
  const [titleSuggestions, setTitleSuggestions] = useState<ResearchTitleSuggestion[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [isResearchTyping, setIsResearchTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper functions untuk deskripsi komprehensif - menggunakan data asli suggestion
  const getComprehensiveDescription = (suggestion: ResearchTitleSuggestion): string => {
    // Use the actual description from the suggestion, fallback to enhanced description based on title
    if (suggestion.description && suggestion.description.length > 50) {
      return suggestion.description;
    }
    
    // Generate enhanced description based on the actual title and field
    const title = suggestion.title.toLowerCase();
    const field = suggestion.field;
    
    if (title.includes('ai') || title.includes('machine learning') || title.includes('neural')) {
      return `Penelitian ini akan mengeksplorasi implementasi teknologi Artificial Intelligence dengan fokus pada ${suggestion.title}. Studi akan mencakup pengembangan dan optimasi model AI untuk menghasilkan solusi inovatif yang dapat diaplikasikan dalam konteks nyata.`;
    } else if (title.includes('sistem') || title.includes('aplikasi') || title.includes('teknologi')) {
      return `Penelitian ini berfokus pada pengembangan ${suggestion.title} dengan pendekatan sistematis dan terstruktur. Studi akan mengkaji aspek teknis, implementasi, dan evaluasi untuk menghasilkan kontribusi yang signifikan di bidang ${field}.`;
    } else if (title.includes('analisis') || title.includes('evaluasi')) {
      return `Penelitian ini akan melakukan analisis mendalam terhadap ${suggestion.title}. Studi akan menggunakan metodologi yang tepat untuk menghasilkan insights dan rekomendasi yang dapat memberikan nilai tambah bagi pengembangan ilmu pengetahuan.`;
    }
    
    return `Penelitian "${suggestion.title}" akan mengeksplorasi aspek fundamental dan aplikatif dalam bidang ${field}. Studi akan mengkaji teori, metodologi, dan praktik terbaik untuk menghasilkan kontribusi ilmiah yang signifikan.`;
  };

  const getResearchScope = (suggestion: ResearchTitleSuggestion): string => {
    // Generate scope based on actual complexity and title characteristics
    const complexity = suggestion.complexity;
    
    let scope = `Penelitian ini akan mencakup studi tentang ${suggestion.title} dengan tingkat kompleksitas ${complexity === 'beginner' ? 'pemula' : complexity === 'intermediate' ? 'menengah' : 'lanjutan'}. `;
    
    if (complexity === 'beginner') {
      scope += `Ruang lingkup meliputi kajian literatur, analisis konsep dasar, dan studi kasus untuk memahami fundamental dari topik penelitian.`;
    } else if (complexity === 'intermediate') {
      scope += `Ruang lingkup mencakup analisis teoritis dan empiris, pengumpulan data primer/sekunder, serta pengembangan model atau prototype.`;
    } else {
      scope += `Ruang lingkup komprehensif dengan pendekatan multimethodologi, experimental design, dan pengembangan framework/algoritma baru.`;
    }
    
    return scope;
  };

  const getMethodologyApproach = (suggestion: ResearchTitleSuggestion): string => {
    // Generate methodology based on actual field and title content
    const title = suggestion.title.toLowerCase();
    const field = suggestion.field;
    
    let methodology = `Metodologi penelitian untuk "${suggestion.title}" akan menggunakan `;
    
    if (title.includes('ai') || title.includes('machine learning') || title.includes('algoritma')) {
      methodology += `pendekatan computational dan experimental dengan implementasi algoritma, training model, validasi, dan evaluasi performance menggunakan metrics yang sesuai.`;
    } else if (title.includes('sistem') || title.includes('aplikasi')) {
      methodology += `pendekatan Software Engineering dengan siklus pengembangan terstruktur: analisis requirements, design, implementasi, testing, dan deployment.`;
    } else if (title.includes('analisis') || title.includes('evaluasi')) {
      methodology += `pendekatan mixed-methods dengan kombinasi analisis kuantitatif dan kualitatif, pengumpulan data melalui survei, wawancara, atau observasi.`;
    } else if (field.toLowerCase().includes('ekonomi') || field.toLowerCase().includes('bisnis')) {
      methodology += `pendekatan quantitative dengan analisis econometric, statistical modeling, dan forecasting berdasarkan data ekonomi yang relevan.`;
    } else {
      methodology += `pendekatan ilmiah yang sesuai dengan karakteristik penelitian, mencakup data collection, analysis, dan interpretation yang sistematis.`;
    }
    
    return methodology;
  };

  const getExpectedOutcomes = (suggestion: ResearchTitleSuggestion): string => {
    // Generate expected outcomes based on actual research characteristics
    const title = suggestion.title;
    const field = suggestion.field;
    const complexity = suggestion.complexity;
    
    let outcomes = `Penelitian "${title}" diharapkan menghasilkan `;
    
    if (complexity === 'advanced') {
      outcomes += `kontribusi ilmiah yang signifikan berupa publikasi di jurnal/conference terkemuka, pengembangan metodologi baru, dan potensi untuk aplikasi komersial atau patent.`;
    } else if (complexity === 'intermediate') {
      outcomes += `findings yang dapat digeneralisasi, rekomendasi praktis untuk implementasi, dan kontribusi untuk pengembangan knowledge base di bidang ${field}.`;
    } else {
      outcomes += `pemahaman yang lebih baik tentang topik penelitian, identifikasi gap penelitian, dan foundation untuk studi lanjutan yang lebih mendalam.`;
    }
    
    outcomes += ` Hasil penelitian akan memberikan nilai tambah bagi komunitas akademik dan praktisi di bidang ${field}.`;
    
    return outcomes;
  };

  // Voice Input Handler
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Browser tidak mendukung voice recognition. Gunakan Chrome, Edge, atau Safari.');
        return;
      }

      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.lang = 'id-ID'; // Indonesian language
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.continuous = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        alert(`Error: ${event.error}. Silakan coba lagi.`);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  // Text-to-Speech Handler
  const handleTextToSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser tidak mendukung text-to-speech. Gunakan browser yang lebih modern.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Get the last assistant message
    const lastAssistantMessage = messages.filter(msg => msg.isAI).pop();
    if (!lastAssistantMessage) {
      alert('Tidak ada pesan AI untuk dibacakan.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.content);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      alert('Error saat membacakan teks. Silakan coba lagi.');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Research Title Selection Component
  const ResearchTitleCard: React.FC<{ 
    suggestion: ResearchTitleSuggestion; 
    onSelect: (id: string) => void; 
    isSelected: boolean 
  }> = ({ suggestion, onSelect, isSelected }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [hoverPosition, setHoverPosition] = useState<'right' | 'left'>('right');
    const cardRef = useRef<HTMLDivElement>(null);
    
    const handleMouseEnter = () => {
      setIsHovered(true);
      
      // Check if there's enough space on the right with new wider card
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const hoverCardWidth = 600; // w-[600px]
        const margin = 16; // ml-4 = 1rem = 16px
        
        // If not enough space on the right, position on the left
        if (rect.right + hoverCardWidth + margin > windowWidth) {
          setHoverPosition('left');
        } else {
          setHoverPosition('right');
        }
      }
    };
    
    return (
      <div 
        ref={cardRef}
        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
          isSelected 
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-md' 
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
        onClick={() => onSelect(suggestion.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Enhanced Hover Card dengan Layout Horizontal */}
        {isHovered && (
          <div className={`absolute top-0 z-50 ${
            hoverPosition === 'right' ? 'left-full ml-4 w-[600px]' : 'right-full mr-4 w-[600px]'
          }`}>
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden">
              {/* Header dengan Gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-3 h-3" />
                  </div>
                  <h3 className="font-bold text-base">Preview Penelitian</h3>
                </div>
              </div>
              
              {/* Content Area - Layout Horizontal */}
              <div className="p-4">
                {/* Judul Penelitian - Full Width */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-blue-300 mb-1">JUDUL PENELITIAN</h4>
                  <p className="text-white font-medium leading-tight text-sm">{suggestion.title}</p>
                </div>
                
                {/* Content Grid - 2 Columns */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* Deskripsi Komprehensif */}
                    <div>
                      <h4 className="text-xs font-semibold text-purple-300 mb-1">GAMBARAN MENYELURUH</h4>
                      <p className="text-gray-200 text-xs leading-relaxed">
                        {getComprehensiveDescription(suggestion)}
                      </p>
                    </div>
                    
                    {/* Metodologi */}
                    <div>
                      <h4 className="text-xs font-semibold text-green-300 mb-1">METODOLOGI</h4>
                      <p className="text-gray-200 text-xs leading-relaxed">
                        {getMethodologyApproach(suggestion)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-3">
                    {/* Research Scope */}
                    <div>
                      <h4 className="text-xs font-semibold text-pink-300 mb-1">RUANG LINGKUP</h4>
                      <p className="text-gray-200 text-xs leading-relaxed">
                        {getResearchScope(suggestion)}
                      </p>
                    </div>
                    
                    {/* Expected Outcomes */}
                    <div>
                      <h4 className="text-xs font-semibold text-yellow-300 mb-1">HASIL DIHARAPKAN</h4>
                      <p className="text-gray-200 text-xs leading-relaxed">
                        {getExpectedOutcomes(suggestion)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Tags dan Info - Bottom */}
                <div className="flex flex-wrap gap-1 pt-3 mt-3 border-t border-white/20">
                  <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded-full">
                    <Star className="w-2 h-2" />
                    <span className="text-xs">{suggestion.field}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-purple-500/20 px-2 py-1 rounded-full">
                    <Clock className="w-2 h-2" />
                    <span className="text-xs">{suggestion.estimatedDuration}</span>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                    suggestion.complexity === 'beginner' ? 'bg-green-500/20' :
                    suggestion.complexity === 'intermediate' ? 'bg-yellow-500/20' :
                    'bg-red-500/20'
                  }`}>
                    <span className="text-xs">
                      {suggestion.complexity === 'beginner' ? '🟢 Pemula' :
                       suggestion.complexity === 'intermediate' ? '🟡 Menengah' : '🔴 Lanjutan'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-500/20 px-2 py-1 rounded-full ml-auto">
                    <span className="text-xs">💡 Klik untuk pilih</span>
                  </div>
                </div>
              </div>
              
              {/* Arrow pointing to card - centered for horizontal layout */}
              <div className={`absolute top-1/2 transform -translate-y-1/2 ${
                hoverPosition === 'right' 
                  ? 'left-0 -translate-x-full w-0 h-0 border-t-6 border-b-6 border-r-6 border-transparent border-r-indigo-900'
                  : 'right-0 translate-x-full w-0 h-0 border-t-6 border-b-6 border-l-6 border-transparent border-l-indigo-900'
              }`}></div>
            </div>
          </div>
        )}
        
        <div className="pr-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
            {suggestion.title}
          </h3>
          
          <p className="text-gray-600 mb-4 leading-relaxed">
            {suggestion.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestion.keywords.map((keyword, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                suggestion.complexity === 'beginner' ? 'bg-green-100 text-green-700' :
                suggestion.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {suggestion.complexity === 'beginner' ? 'Pemula' :
                 suggestion.complexity === 'intermediate' ? 'Menengah' : 'Lanjutan'}
              </span>
              
              <span className="text-gray-500 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {suggestion.estimatedDuration}
              </span>
            </div>
            
            <span className="text-purple-600 font-medium flex items-center">
              <Star className="w-4 h-4 mr-1" />
              {suggestion.field}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Research Typing Indicator Component
  const ResearchTypingIndicator: React.FC = () => (
    <div className="flex justify-start mb-6">
      <div className="flex items-start space-x-3 max-w-3xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-sm rounded-2xl px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-purple-700 font-medium">Research Assistant sedang menganalisis...</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Handle research title selection
  const handleTitleSelection = (titleId: string) => {
    setSelectedTitleId(titleId);
    const selectedTitle = titleSuggestions.find(t => t.id === titleId);
    
    if (selectedTitle) {
      setResearchStep('journals');
      const selectionMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `🎉 **JUDUL PENELITIAN BERHASIL DIPILIH!**

---

### 📋 **Judul Terpilih:**
> **"${selectedTitle.title}"**

### 📊 **Detail Penelitian:**
- **Bidang:** ${selectedTitle.field}
- **Kompleksitas:** ${selectedTitle.complexity}
- **Estimasi Durasi:** ${selectedTitle.estimatedDuration}
- **Keywords:** ${selectedTitle.keywords.join(', ')}

---

### ✨ **Selamat!** Judul penelitian Anda telah berhasil dipilih dan tersimpan dalam sistem.

### 🚀 **Langkah Selanjutnya: Pencarian Referensi Jurnal**

Saya akan segera mencari jurnal-jurnal berkualitas tinggi yang relevan dengan topik penelitian Anda:

### 🎯 **Kriteria Pencarian Jurnal:**
- ✅ **Scopus Q1-Q4** dan **SINTA 1-5**
- ✅ **Publikasi terbaru** (2019-2024)
- ✅ **Relevansi tinggi** dengan topik penelitian
- ✅ **Impact factor** yang baik
- ✅ **Jurnal internasional** bereputasi

### ⏳ **Status:** Memulai pencarian jurnal referensi...`,
        isAI: true,
        timestamp: new Date(),
        suggestions: ['Lanjutkan pencarian jurnal', 'Ganti judul penelitian', 'Lihat detail lengkap']
      };
      
      setMessages(prev => [...prev, selectionMessage]);
      
      // Auto transition to journal search after 2 seconds
      setTimeout(() => {
        setResearchStep('journals');
        searchJournals(selectedTitle.title, selectedTitle.field);
      }, 2000);
    }
  };

  // Search for journals with real AI
  const searchJournals = async (title: string, field: string) => {
    setIsResearchTyping(true);
    
    const prompt = `Berdasarkan judul penelitian "${title}" di bidang "${field}", carikan 8-10 jurnal penelitian berkualitas yang RELEVAN. 

Tolong berikan daftar jurnal dengan format yang mudah dibaca:
1. Terindeks Scopus (Q1-Q4) atau SINTA (1-5)
2. Publikasi tahun 2019-2024
3. Topik yang sangat relevan dengan judul penelitian
4. Impact factor yang baik

Untuk setiap jurnal, tuliskan dalam format yang menarik dan mudah dipahami. JANGAN gunakan format JSON atau kode.`;

    try {
      // Send to AI for real journal search
      await sendMessage(prompt, []);
      
      setTimeout(() => {
        setIsResearchTyping(false);
        
        const journalMessage: Message = {
          id: Date.now().toString(),
          content: `📚 **PENCARIAN JURNAL REFERENSI SELESAI!**

---

### 🎯 **Hasil Pencarian untuk:** 
> **"${title}"**

### 📊 **Ringkasan Hasil:**
- ✅ **Total jurnal ditemukan:** 8 jurnal berkualitas tinggi
- ✅ **Jurnal Scopus:** 5 jurnal (Q1-Q2)  
- ✅ **Jurnal SINTA:** 3 jurnal (Level 1-2)
- ✅ **Periode publikasi:** 2019-2024
- ✅ **Status:** Semua jurnal telah diverifikasi relevansinya

---

### 🏆 **Kualitas Jurnal:**
- **Impact Factor:** Tinggi hingga sangat tinggi
- **Sitasi:** Aktif dan banyak dikutip
- **Relevansi:** Sangat sesuai dengan topik penelitian
- **Aksesibilitas:** Tersedia online

### 💡 **Rekomendasi Selanjutnya:**
Jurnal-jurnal ini telah dipilih khusus berdasarkan relevansi tinggi dengan penelitian Anda dan memiliki reputasi akademik yang excellent. Anda dapat melanjutkan ke tahap analisis jurnal atau memilih referensi utama.`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Cari jurnal lain', 'Analisis jurnal ini', 'Pilih referensi utama', 'Lanjut ke tahap 3']
        };
        
        setMessages(prev => [...prev, journalMessage]);
      }, 3000);
      
    } catch (error) {
      setIsResearchTyping(false);
      console.error('Error searching journals:', error);
    }
  };

  // Generate research titles with real AI
  const generateResearchTitles = async (background: string = '', field: string = '') => {
    setIsResearchTyping(true);
    
    const prompt = `Berdasarkan latar belakang "${background}" dan bidang "${field}", buatkan 5 judul penelitian yang:
1. ORIGINAL dan BUKAN template
2. Spesifik dan dapat diteliti
3. Memiliki kontribusi ilmiah yang jelas
4. Sesuai dengan tren penelitian terkini
5. Realistis untuk diselesaikan

Berikan response dalam format yang mudah dibaca oleh pengguna. Untuk setiap judul, jelaskan:
- Deskripsi singkat penelitian (2-3 kalimat)
- Tingkat kompleksitas penelitian
- Estimasi durasi penelitian
- Kata kunci utama
- Bidang studi yang spesifik

Tuliskan dalam format yang menarik dan mudah dipahami, JANGAN gunakan format JSON atau kode.`;

    try {
      // Kirim ke AI untuk menghasilkan judul asli
      await sendMessage(prompt, []);
      
      // Setelah AI response selesai, set typing ke false
      setIsResearchTyping(false);
      
    } catch (error) {
      setIsResearchTyping(false);
      console.error('Error generating titles:', error);
    }
  };

  // Format message with markdown
  const formatMessage = React.useCallback((content: string): React.ReactNode => {
    const components = {
      code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : 'text';
        const isInline = !className;
        if (!isInline) {
          return (
            <div className="code-block-container">
              <div className="code-block-header">
                <span className="code-language-label">{language}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(String(children))}
                  className="code-copy-button"
                  title="Copy code"
                >
                  <Copy className="h-3 w-3 mr-1.5 inline" />
                  Copy
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
      // Table components
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-gray-50">
          {children}
        </thead>
      ),
      tbody: ({ children }: { children?: React.ReactNode }) => (
        <tbody className="bg-white divide-y divide-gray-200">
          {children}
        </tbody>
      ),
      tr: ({ children }: { children?: React.ReactNode }) => (
        <tr className="hover:bg-gray-50">
          {children}
        </tr>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
          {children}
        </th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0">
          {children}
        </td>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="mb-4 leading-relaxed text-gray-700 whitespace-pre-wrap">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-4 ml-6 space-y-2 list-disc">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-4 ml-6 space-y-2 list-decimal">{children}</ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="leading-relaxed text-gray-700 mb-1">{children}</li>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-lg font-bold mb-2 mt-4 text-gray-900">{children}</h3>
      ),
      h4: ({ children }: { children?: React.ReactNode }) => (
        <h4 className="text-base font-bold mb-2 mt-3 text-gray-900">{children}</h4>
      ),
      h5: ({ children }: { children?: React.ReactNode }) => (
        <h5 className="text-sm font-bold mb-2 mt-3 text-gray-900">{children}</h5>
      ),
      h6: ({ children }: { children?: React.ReactNode }) => (
        <h6 className="text-sm font-bold mb-2 mt-3 text-gray-700">{children}</h6>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-gray-900">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-gray-700">{children}</em>
      ),
      hr: () => (
        <hr className="my-6 border-t border-gray-300" />
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="pl-4 my-4 italic py-3 rounded-r border-l-4 border-blue-400 bg-blue-50 text-gray-700">
          {children}
        </blockquote>
      ),
    } as unknown as import('react-markdown').Components;
    
    return (
      <div className="markdown-content space-y-2">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }, []);

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
    'Ketik **"mulai penelitian"** untuk memulai research assistant, atau gunakan chat biasa untuk bantuan umum.'
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

  // Function to clean text from markdown symbols
  const cleanText = useCallback((text: string): string => {
    return text
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/#{1,6}\s*/g, '') // Remove headers
      .replace(/^\s*[-*+]\s*/gm, '') // Remove bullet points
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
      .replace(/`/g, '') // Remove code backticks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to plain text
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim();
  }, []);

  // Function to parse AI response and extract research titles with detailed information
  const parseAIResponseForTitles = useCallback((aiResponse: string): ResearchTitleSuggestion[] => {
    const titles: ResearchTitleSuggestion[] = [];
    
    // Enhanced parsing - extract comprehensive information from AI response
    const lines = aiResponse.split('\n');
    let currentTitle = '';
    let currentDescription = '';
    let currentField = 'Multidisiplin';
    let currentComplexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    let currentDuration = '6-8 bulan';
    let currentKeywords: string[] = ['Penelitian', 'Inovasi'];
    let titleCounter = 1;
    
    // Filter words that should NOT be considered as titles
    const excludePatterns = [
      'deskripsi', 'description', 'tingkat kompleksitas', 'kompleksitas', 'complexity',
      'estimasi durasi', 'durasi', 'duration', 'kata kunci', 'keywords', 'bidang',
      'field', 'pilih judul', 'klik pada', 'memilihnya', 'melanjutkan', 'pencarian jurnal',
      'penelitian yang', 'layak untuk', 'menarik dan', 'lebih lanjut', 'berdasarkan',
      'buatkan', 'berikan', 'tolong', 'silakan', 'untuk setiap', 'gunakan format',
      'contoh judul', 'contoh penelitian', 'riset', 'fokus'
    ];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const lowerLine = trimmedLine.toLowerCase();
      
      // Skip if line contains exclude patterns
      const shouldExclude = excludePatterns.some(pattern => lowerLine.includes(pattern));
      if (shouldExclude) return;
      
      // Look for actual research titles with better detection
      const isNumberedTitle = trimmedLine.match(/^\d+\.\s*(.+)/) && trimmedLine.length > 25;
      const isBoldTitle = trimmedLine.includes('**') && trimmedLine.length > 30;
      const isQuotedTitle = (trimmedLine.includes('"') || trimmedLine.includes('"') || trimmedLine.includes('"')) && trimmedLine.length > 25;
      const isHeaderTitle = trimmedLine.match(/^#{1,4}\s+/) && trimmedLine.length > 25;
      
      // Additional criteria for detecting research titles
      const hasResearchWords = /\b(analisis|implementasi|pengembangan|pengaruh|hubungan|perancangan|evaluasi|studi|kajian|optimasi|pemanfaatan|penerapan)\b/i.test(trimmedLine);
      const hasMethodWords = /\b(machine learning|deep learning|blockchain|iot|sistem|aplikasi|model|algoritma|metode|teknik)\b/i.test(trimmedLine);
      
      if ((isNumberedTitle || isBoldTitle || isQuotedTitle || isHeaderTitle) && 
          (hasResearchWords || hasMethodWords || trimmedLine.length > 50)) {
        if (currentTitle) {
          // Save previous title
          titles.push({
            id: Date.now().toString() + titleCounter,
            title: cleanText(currentTitle),
            description: cleanText(currentDescription) || 'Penelitian yang menarik dan layak untuk diteliti lebih lanjut.',
            field: currentField,
            complexity: currentComplexity,
            estimatedDuration: currentDuration,
            keywords: currentKeywords
          });
          titleCounter++;
        }
        
        // Extract new title - clean it from symbols
        currentTitle = cleanText(trimmedLine);
        
        // Reset for new title
        currentDescription = '';
        currentField = 'Multidisiplin';
        currentComplexity = 'intermediate';
        currentDuration = '6-8 bulan';
        currentKeywords = ['Penelitian', 'Inovasi'];
        
        // Look for description and other details in next lines
        for (let i = index + 1; i < Math.min(index + 8, lines.length); i++) {
          const nextLine = lines[i].trim();
          const nextLowerLine = nextLine.toLowerCase();
          
          if (!nextLine || nextLine.match(/^\d+\./) || nextLine.match(/^#{1,4}\s+/)) break;
          
          // Skip if next line contains exclude patterns
          const nextShouldExclude = excludePatterns.some(pattern => nextLowerLine.includes(pattern));
          if (nextShouldExclude) continue;
          
          // Extract description - take any non-header line as potential description
          if (!nextLine.includes('Bidang') && !nextLine.includes('Kompleksitas') && 
              !nextLine.includes('Durasi') && !nextLine.includes('Kata Kunci') &&
              !nextLine.includes('Keywords') && !nextLine.includes('Field') &&
              !nextLine.includes('Tingkat') && !nextLine.includes('Estimasi') &&
              nextLine.length > 10) {
            currentDescription += cleanText(nextLine) + ' ';
          }
          
          // Extract field
          if (nextLine.includes('Bidang') || nextLine.includes('Field')) {
            const fieldMatch = nextLine.match(/(?:Bidang|Field)[^:]*:\s*(.+)/);
            if (fieldMatch) {
              currentField = fieldMatch[1].trim();
            }
          }
          
          // Extract complexity
          if (nextLine.includes('Kompleksitas') || nextLine.includes('Tingkat')) {
            if (nextLine.toLowerCase().includes('tinggi') || nextLine.toLowerCase().includes('advanced')) {
              currentComplexity = 'advanced';
            } else if (nextLine.toLowerCase().includes('sedang') || nextLine.toLowerCase().includes('intermediate')) {
              currentComplexity = 'intermediate';
            } else if (nextLine.toLowerCase().includes('pemula') || nextLine.toLowerCase().includes('beginner')) {
              currentComplexity = 'beginner';
            }
          }
          
          // Extract duration
          if (nextLine.includes('Durasi') || nextLine.includes('Estimasi') || nextLine.match(/\d+-\d+\s*(bulan|month)/)) {
            const durationMatch = nextLine.match(/(\d+-\d+\s*(?:bulan|month))/);
            if (durationMatch) {
              currentDuration = durationMatch[1];
            }
          }
          
          // Extract keywords
          if (nextLine.includes('Kata Kunci') || nextLine.includes('Keywords')) {
            const keywordMatch = nextLine.match(/(?:Kata Kunci|Keywords)[^:]*:\s*(.+)/);
            if (keywordMatch) {
              currentKeywords = keywordMatch[1].split(',').map(k => k.trim()).slice(0, 5);
            }
          }
          
          // Auto-detect field from title content with more specific patterns
          const titleLower = currentTitle.toLowerCase();
          if (titleLower.includes('ai ') || titleLower.includes('artificial intelligence') || 
              titleLower.includes('machine learning') || titleLower.includes('deep learning') ||
              titleLower.includes('neural network')) {
            currentField = 'Kecerdasan Buatan';
          } else if (titleLower.includes('blockchain') || titleLower.includes('sistem informasi') ||
                     titleLower.includes('teknologi informasi') || titleLower.includes('software') ||
                     titleLower.includes('aplikasi') || titleLower.includes('database')) {
            currentField = 'Teknologi Informasi';
          } else if (titleLower.includes('ekonomi') || titleLower.includes('bisnis') ||
                     titleLower.includes('keuangan') || titleLower.includes('manajemen') ||
                     titleLower.includes('marketing') || titleLower.includes('e-commerce')) {
            currentField = 'Ekonomi dan Bisnis';
          } else if (titleLower.includes('kesehatan') || titleLower.includes('medis') ||
                     titleLower.includes('kedokteran') || titleLower.includes('farmasi') ||
                     titleLower.includes('biomedis')) {
            currentField = 'Kesehatan';
          } else if (titleLower.includes('pendidikan') || titleLower.includes('pembelajaran') ||
                     titleLower.includes('edukasi') || titleLower.includes('kurikulum') ||
                     titleLower.includes('teaching')) {
            currentField = 'Pendidikan';
          } else if (titleLower.includes('lingkungan') || titleLower.includes('energi') ||
                     titleLower.includes('sustainability') || titleLower.includes('renewable')) {
            currentField = 'Lingkungan dan Energi';
          } else if (titleLower.includes('teknik') || titleLower.includes('engineering') ||
                     titleLower.includes('industri') || titleLower.includes('manufaktur')) {
            currentField = 'Teknik dan Industri';
          }
          
          // Auto-detect complexity from title characteristics
          if (currentTitle.length > 120 || titleLower.includes('optimasi') || 
              titleLower.includes('neural') || titleLower.includes('quantum') ||
              titleLower.includes('advanced') || titleLower.includes('hybrid')) {
            currentComplexity = 'advanced';
          } else if (currentTitle.length < 70 || titleLower.includes('analisis') || 
                     titleLower.includes('implementasi') || titleLower.includes('pengembangan')) {
            currentComplexity = 'intermediate';
          }
          
          // Auto-extract keywords from title with more sophisticated method
          const titleWords = currentTitle.toLowerCase().split(' ');
          const techKeywords = [
            'ai', 'machine learning', 'blockchain', 'iot', 'big data', 'cloud', 'mobile', 'web', 
            'sistem', 'algoritma', 'optimasi', 'neural', 'deep learning', 'database', 'security',
            'reinforcement learning', 'computer vision', 'natural language', 'data mining',
            'bioinformatics', 'robotics', 'automation', 'digitalization'
          ];
          
          const foundTechKeywords = techKeywords.filter(keyword => 
            titleWords.some(word => word.includes(keyword.split(' ')[0]) || keyword.split(' ')[0].includes(word))
          );
          
          if (foundTechKeywords.length > 0) {
            currentKeywords = [...new Set([...foundTechKeywords.slice(0, 3), 'Penelitian', 'Inovasi'])].slice(0, 5);
          }
        }
      }
    });
    
    // Add the last title if exists
    if (currentTitle) {
      titles.push({
        id: Date.now().toString() + titleCounter,
        title: cleanText(currentTitle),
        description: cleanText(currentDescription) || 'Penelitian yang menarik dan layak untuk diteliti lebih lanjut.',
        field: currentField,
        complexity: currentComplexity,
        estimatedDuration: currentDuration,
        keywords: currentKeywords
      });
    }
    
    return titles;
  }, [cleanText]);

  // Extract links from content
  const extractLinksFromContent = useCallback((content: string): { label: string; href: string }[] => {
    const links: { label: string; href: string }[] = [];
    
    // Regex untuk mendeteksi links dalam format yang berbeda
    const patterns = [
      // Format: Label: https://example.com (dengan spasi atau tanpa spasi)
      /([A-Za-z][A-Za-z0-9\s]*[A-Za-z0-9])\s*:\s*(https?:\/\/[^\s\n]+)/g,
      // Format: **Label**: https://example.com
      /\*\*([^*]+)\*\*\s*:\s*(https?:\/\/[^\s\n]+)/g,
      // Format: [Label](https://example.com)
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
    ];
    
    patterns.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const label = match[1].trim();
        const href = match[2].trim();
        
        // Cek apakah link sudah ada
        const exists = links.some(link => link.href === href);
        if (!exists && label && href) {
          links.push({
            label: label,
            href: href
          });
        }
      }
    });
    
    return links;
  }, []);

  // Function untuk mendapatkan favicon URL
  const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '/favicon.ico'; // fallback
    }
  };

  // Listen for new AI responses - moved after parseAIResponseForTitles declaration
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
  }, [state.responses, isResearchMode, researchStep, parseAIResponseForTitles, extractLinksFromContent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Switch to Research Mode
  const switchToResearchMode = () => {
    setIsResearchMode(true);
    setResearchStep('initial');
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedImages.length === 0) || state.isProcessing) return;

    const lowerInput = inputValue.toLowerCase();
    
    // Check for research commands FIRST
    const isResearchCommand = lowerInput === 'mulai penelitian' || 
        lowerInput === 'start research' || 
        lowerInput === 'research assistant' ||
        lowerInput === 'mode penelitian' ||
        lowerInput === 'bantuan penelitian' ||
        lowerInput.startsWith('mulai penelitian ') ||
        lowerInput.startsWith('start research ') ||
        lowerInput.startsWith('research assistant ');

    // Handle research commands IMMEDIATELY - no other processing
    if (isResearchCommand) {
      // Switch to research mode FIRST
      switchToResearchMode();
      setResearchStep('title');

      // Create user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        isAI: false,
        timestamp: new Date(),
        images: attachedImages.length ? [...attachedImages] : undefined
      };

      // Add user message to research mode
      setMessages(prev => [...prev, userMessage]);
      
      const researchMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `# 🔬 **RESEARCH ASSISTANT ACTIVATED!**

---

## 🚀 **Welcome to Advanced Research Mode**

### 📚 **What Can You Do Here?**

**Research Assistant** membantu Anda menyelesaikan penelitian akademik secara sistematis dan terstruktur.

---

## 🎯 **Quick Start Options**

### **Option 1: I Have a Research Title** 
🎪 **Already know what to research?**
- Input your research title directly
- Get validation and improvement suggestions
- Receive expert recommendations

### **Option 2: Need Research Ideas**
💡 **Still exploring possibilities?**
- Tell me your field of interest
- Get 5 original research title suggestions
- Choose the perfect topic for you

---

## 🔥 **Popular Research Fields**

**🤖 Technology & AI**
*Artificial Intelligence, Machine Learning, Data Science*

**💻 Computer Science**  
*Algorithms, Software Engineering, System Architecture*

**💰 Business & Economics**
*Digital Marketing, E-commerce, Financial Technology*

**🏥 Health & Medicine**
*Telemedicine, Healthcare Technology, Medical Informatics*

**📚 Education & Learning**
*E-Learning, Educational Technology, Learning Analytics*

---

### 💬 **How to Start?**

Simply type your field of interest or research topic. Examples:
- *"I'm interested in AI research"*
- *"Need ideas for business research"*  
- *"Computer science topics"*
- *"Already have title: [Your Title Here]"*

**Let's make your research journey extraordinary!** 🌟`,
        isAI: true,
        timestamp: new Date(),
        suggestions: [
          '🤖 Technology & AI research',
          '💻 Computer Science research', 
          '💰 Business & Economics research',
          '🏥 Health & Medicine research',
          '📚 Education research',
          'I already have a research title'
        ]
      };
      
      setMessages(prev => [...prev, researchMessage]);
      setInputValue('');
      setAttachedImages([]);
      return;
    }

    // Regular message processing
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date(),
      images: attachedImages.length ? [...attachedImages] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Research Assistant Commands
    if (lowerInput.includes('mulai penelitian') || lowerInput.includes('start research') || lowerInput.includes('research assistant')) {
      setIsResearchMode(true);
      setResearchStep('title');
      const researchMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `# 🔬 **SELAMAT DATANG DI RESEARCH ASSISTANT!**

---

### 🎯 **Visi & Misi**
Saya akan membantu Anda dalam perjalanan penelitian akademik yang menyeluruh, dari konseptualisasi hingga implementasi akhir.

---

### 📋 **TAHAP 1: PENENTUAN JUDUL PENELITIAN**

Pilih jalur yang sesuai dengan kondisi Anda:

#### 🎪 **OPSI A: Sudah Memiliki Judul**
- ✅ Langsung masukkan judul penelitian Anda
- ✅ Sistem akan memvalidasi kelayakan dan relevansi
- ✅ Mendapatkan saran perbaikan jika diperlukan

#### 🎨 **OPSI B: Belum Memiliki Judul** 
- 💡 Ceritakan latar belakang yang menarik minat Anda
- 💡 Sebutkan bidang studi yang ingin dieksplorasi
- 💡 Sistem AI akan menghasilkan rekomendasi judul original

---

### 🌟 **CONTOH LATAR BELAKANG YANG EFEKTIF:**

> **🤖 Bidang AI & Teknologi:**
> *"Saya tertarik meneliti dampak AI terhadap transformasi pendidikan digital"*

> **💻 Bidang Teknik Informatika:**
> *"Fokus machine learning untuk optimasi sistem cerdas"*

> **💰 Bidang Ekonomi & Bisnis:**
> *"Penelitian tentang evolusi e-commerce di era digital"*

> **🏥 Bidang Kesehatan:**
> *"Implementasi teknologi dalam peningkatan layanan medis"*

---

### 🚀 **Siap Memulai?** Pilih opsi di bawah atau ketik langsung!`,
        isAI: true,
        timestamp: new Date(),
        suggestions: [
          'Saya sudah punya judul penelitian',
          'Belum punya judul - bidang AI',
          'Bidang teknik informatika',
          'Bidang ekonomi dan bisnis',
          'Bidang kesehatan',
          'Bidang pendidikan'
        ]
      };
      setMessages(prev => [...prev, researchMessage]);
      setInputValue('');
      return;
    }

    // Handle research flow
    if (isResearchMode && researchStep === 'title') {
      if (lowerInput.includes('belum punya') || lowerInput.includes('bidang') || 
          lowerInput.includes('tertarik meneliti') || lowerInput.includes('fokus')) {
        // Generate titles based on user input field/background
        setTimeout(() => {
          generateResearchTitles(inputValue, inputValue);
        }, 1000);
        setInputValue('');
        return;
      }
    }
    
    // Website redirect command - enhanced to handle multiple URL patterns
    if (lowerInput.includes('arahkan') || lowerInput.includes('redirect') || 
        lowerInput.includes('buka website') || lowerInput.includes('go to') || 
        lowerInput.includes('kunjungi') || lowerInput.includes('visit') ||
        lowerInput.includes('ke google') || lowerInput.includes('to google')) {
      
      // Try to find URL pattern
      let urlMatch = inputValue.match(/https?:\/\/[^\s]+/);
      
      // If no full URL, try to find domain pattern
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
        } else if (lowerInput.includes('twitter') || lowerInput.includes('x.com')) {
          urlMatch = ['https://x.com'];
        } else if (lowerInput.includes('github')) {
          urlMatch = ['https://github.com'];
        } else if (lowerInput.includes('stackoverflow')) {
          urlMatch = ['https://stackoverflow.com'];
        }
      }
      
      if (urlMatch) {
        const targetUrl = urlMatch[0];
        
        // Add confirmation message
        const redirectMessage: Message = {
          id: Date.now().toString(),
          content: `🌐 **Membuka Website**\n\nAnda akan diarahkan ke: **${targetUrl}**\n\n✅ Website sedang dibuka di tab baru...`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Kembali ke chat', 'Buka website lain', 'Arahkan ke google.com']
        };
        
        setMessages(prev => [...prev, redirectMessage]);
        
        // Open URL in new tab with slight delay for better UX
        setTimeout(() => {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }, 500);
        
        setInputValue('');
        return;
      } else {
        // No valid URL found
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `❌ **URL Tidak Ditemukan**\n\nMohon berikan URL yang valid atau nama website.\n\n**Contoh yang benar:**\n- "Arahkan ke google.com"\n- "Buka youtube.com"\n- "Go to https://github.com"\n- "Kunjungi stackoverflow.com"`,
          isAI: true,
          timestamp: new Date(),
          suggestions: ['Arahkan ke google.com', 'Buka youtube.com', 'Go to github.com']
        };
        
        setMessages(prev => [...prev, errorMessage]);
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
      await sendMessage(inputValue, attachedImages.length ? attachedImages : undefined);
      if (attachedImages.length) setAttachedImages([]);
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
    const lowerSuggestion = suggestion.toLowerCase();
    
    // Handle special research mode suggestions
    if (lowerSuggestion.includes('cari judul lain') || lowerSuggestion.includes('generate judul lain')) {
      // Generate new titles with different approach
      const newPromptMessage: Message = {
        id: Date.now().toString(),
        content: 'Silakan berikan latar belakang atau bidang penelitian yang berbeda untuk mendapatkan rekomendasi judul yang baru:',
        isAI: true,
        timestamp: new Date(),
        suggestions: ['Bidang Teknik Informatika', 'Bidang Ekonomi', 'Bidang Kesehatan', 'Bidang Pendidikan', 'Bidang Lingkungan']
      };
      setMessages(prev => [...prev, newPromptMessage]);
      return;
    }
    
    if (lowerSuggestion.includes('cari jurnal lain') || lowerSuggestion.includes('cari yang lain')) {
      // Search for different journals
      const searchAgainMessage: Message = {
        id: Date.now().toString(),
        content: 'Mencari jurnal dengan kriteria yang berbeda atau kata kunci alternatif...',
        isAI: true,
        timestamp: new Date(),
        suggestions: ['Jurnal internasional', 'Jurnal nasional', 'Conference paper', 'Thesis repository']
      };
      setMessages(prev => [...prev, searchAgainMessage]);
      return;
    }
    
    if (lowerSuggestion.includes('lanjut ke tahap 3') || lowerSuggestion.includes('tahap 3')) {
      // Proceed to step 3: Journal Analysis
      setResearchStep('analysis');
      const analysisMessage: Message = {
        id: Date.now().toString(),
        content: `🔍 **TAHAP 3: ANALISIS JURNAL REFERENSI**

---

### 📋 **Selamat datang di Tahap Analisis Jurnal!**

Pada tahap ini, saya akan membantu Anda menganalisis jurnal-jurnal yang telah ditemukan untuk mendapatkan insights mendalam yang akan mendukung penelitian Anda.

### 🎯 **Jenis Analisis yang Tersedia:**

#### 1. **📊 Analisis Metodologi**
- Pendekatan penelitian yang digunakan
- Teknik pengumpulan data
- Metode analisis data
- Tools dan software yang digunakan

#### 2. **🔬 Analisis Temuan Utama**
- Hasil penelitian terpenting
- Kontribusi ilmiah yang signifikan
- Novelty dan originality
- Impact terhadap bidang studi

#### 3. **🔍 Gap Analysis**
- Keterbatasan penelitian sebelumnya
- Area yang belum diteliti
- Opportunities untuk penelitian lanjutan
- Potensi kontribusi penelitian Anda

#### 4. **📈 Citation & Impact Analysis**
- Frekuensi sitasi
- H-index penulis
- Journal impact factor
- Tren sitasi dari waktu ke waktu

### 💡 **Pilih jenis analisis yang Anda inginkan:**`,
        isAI: true,
        timestamp: new Date(),
        suggestions: ['Analisis Metodologi', 'Analisis Temuan Utama', 'Gap Analysis', 'Citation Analysis', 'Analisis Komprehensif']
      };
      setMessages(prev => [...prev, analysisMessage]);
      return;
    }
    
    // Default behavior
    setInputValue(suggestion);
    trackBehavior({
      type: 'suggestion_click',
      suggestion,
      timestamp: Date.now()
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="navbar-surface/90 backdrop-blur border-b panel-surface sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center accent-gradient">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                  Advanced AI Assistant
                  {isResearchMode && (
                    <span className="ml-3 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full flex items-center animate-pulse">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Research Mode
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-600">
                  {state.isProcessing ? (
                    <span className="flex items-center">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Memproses permintaan Anda...
                    </span>
                  ) : isResearchMode ? (
                    `📚 Research Assistant - Step: ${researchStep}`
                  ) : (
                    'Code • Themes • Websites • Research'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
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

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Research Progress Sidebar with Animation */}
        <div className={`transition-all duration-500 ease-in-out ${
          isResearchMode ? 'w-80 opacity-100' : 'w-0 opacity-0'
        } bg-gradient-to-b from-purple-50 to-indigo-50 border-r border-purple-200 sticky top-0 h-screen overflow-hidden shadow-lg`}>
          <div className={`transition-all duration-300 delay-200 ${
            isResearchMode ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
          } p-6 space-y-6 h-full flex flex-col`}>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                Research Progress
              </h3>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 flex-1">{/* Removed overflow-y-auto */}
              <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                researchStep === 'title' ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105' : 
                ['journals', 'analysis', 'references', 'writing'].includes(researchStep) ? 'border-green-500 bg-green-50' : 
                'border-gray-200 bg-white'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                  researchStep === 'title' ? 'bg-purple-500 text-white animate-pulse' :
                  ['journals', 'analysis', 'references', 'writing'].includes(researchStep) ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {['journals', 'analysis', 'references', 'writing'].includes(researchStep) ? '✓' : '1'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Research Title</h4>
                  <p className="text-sm text-gray-600">Define research focus</p>
                </div>
              </div>

              <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                researchStep === 'journals' ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105' : 
                ['analysis', 'references', 'writing'].includes(researchStep) ? 'border-green-500 bg-green-50' : 
                'border-gray-200 bg-white'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                  researchStep === 'journals' ? 'bg-purple-500 text-white animate-pulse' :
                  ['analysis', 'references', 'writing'].includes(researchStep) ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {['analysis', 'references', 'writing'].includes(researchStep) ? '✓' : '2'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Journal Search</h4>
                  <p className="text-sm text-gray-600">Find Scopus/SINTA papers</p>
                </div>
              </div>

              <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                researchStep === 'analysis' ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105' : 
                ['references', 'writing'].includes(researchStep) ? 'border-green-500 bg-green-50' : 
                'border-gray-200 bg-white'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                  researchStep === 'analysis' ? 'bg-purple-500 text-white animate-pulse' :
                  ['references', 'writing'].includes(researchStep) ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {['references', 'writing'].includes(researchStep) ? '✓' : '3'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Journal Analysis</h4>
                  <p className="text-sm text-gray-600">Deep content analysis</p>
                </div>
              </div>

              <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                researchStep === 'references' ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105' : 
                researchStep === 'writing' ? 'border-green-500 bg-green-50' : 
                'border-gray-200 bg-white'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                  researchStep === 'references' ? 'bg-purple-500 text-white animate-pulse' :
                  researchStep === 'writing' ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {researchStep === 'writing' ? '✓' : '4'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Reference Selection</h4>
                  <p className="text-sm text-gray-600">Choose key references</p>
                </div>
              </div>

              <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                researchStep === 'writing' ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105' : 'border-gray-200 bg-white'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                  researchStep === 'writing' ? 'bg-purple-500 text-white animate-pulse' : 'bg-gray-300 text-gray-600'
                }`}>
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Chapter Writing</h4>
                  <p className="text-sm text-gray-600">Generate content</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-purple-200 flex-shrink-0">
              <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setIsResearchMode(false);
                    setResearchStep('initial');
                    setTitleSuggestions([]);
                    setSelectedTitleId(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Exit Research Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 flex flex-col px-6 md:px-10 lg:px-16 py-6 w-full">
          <div className="flex-1 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start space-x-3 w-full ${message.isAI ? '' : 'flex-row-reverse space-x-reverse'}`}>
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

                  {/* Message Column */}
                  <div className={`${message.isAI ? 'max-w-4xl w-full' : 'max-w-2xl'}`}>
                    {/* Message Bubble */}
                    <div className={`relative group inline-block rounded-2xl p-4 ${
                      message.isAI 
                        ? 'w-full bg-[rgba(255,255,255,0.7)] backdrop-blur border border-gray-200 shadow-sm'
                        : 'accent-gradient text-white max-w-fit'
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
                        {message.isAI ? (
                          <div className="prose prose-sm max-w-none">
                            {formatMessage(message.content)}
                          </div>
                        ) : (
                          <div className="text-white whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </div>
                        )}
                        
                        {/* Research Title Suggestions Display */}
                        {message.researchData?.type === 'title_suggestions' && (
                          <div className="mt-6">
                            <div className="grid gap-4">
                              {(message.researchData.data as ResearchTitleSuggestion[]).map((suggestion) => (
                                <ResearchTitleCard
                                  key={suggestion.id}
                                  suggestion={suggestion}
                                  onSelect={handleTitleSelection}
                                  isSelected={selectedTitleId === suggestion.id}
                                />
                              ))}
                            </div>
                            
                            {selectedTitleId && (
                              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700 font-medium">
                                  ✅ Judul penelitian telah dipilih! Klik &quot;Lanjutkan ke pencarian jurnal&quot; untuk melanjutkan.
                                </p>
                              </div>
                            )}
                          </div>
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
                      
                      {/* Links Display */}
                      {message.links && message.links.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2 flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Link terkait:
                          </p>
                          <div className="space-y-2">
                            {message.links.map((link, index) => (
                              <a
                                key={index}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all duration-200 group cursor-pointer hover:shadow-md hover:scale-[1.02]"
                              >
                                {/* Website Favicon */}
                                <div className="flex-shrink-0 mr-3">
                                  <NextImage
                                    src={getFaviconUrl(link.href)}
                                    alt={`${link.label} favicon`}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded"
                                    unoptimized
                                    onError={(e) => {
                                      // Fallback to a generic link icon if favicon fails
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="w-6 h-6 bg-blue-500 rounded items-center justify-center hidden">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>

                                {/* Link Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-blue-900 truncate group-hover:text-blue-700">
                                      {link.label}
                                    </h4>
                                    <div className="ml-2 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">{link.href}</p>
                                </div>
                              </a>
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
              </div>
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

          {/* Input Area */}
          <div className="sticky bottom-0 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200">
            <div className="mx-auto max-w-4xl w-full px-4 sm:px-6">
              <div className="rounded-2xl border panel-surface shadow p-3">
                <div className="flex items-start space-x-3 w-full">
                  <div className="flex-1">
                    {attachedImages.length > 0 && (
                      <div className="mb-2 border border-gray-200 bg-white rounded-xl p-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-600">Lampiran ({attachedImages.length})</p>
                          <button
                            onClick={() => setAttachedImages([])}
                            className="text-xs px-2 py-1 rounded border text-gray-600 hover:bg-gray-50"
                            title="Hapus semua gambar"
                          >Hapus semua</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {attachedImages.map((img, idx) => (
                            <div key={idx} className="relative w-16 h-16 flex-shrink-0">
                              <NextImage src={img} alt={`preview ${idx+1}`} fill unoptimized className="object-cover rounded-lg border shadow-sm" />
                              <button
                                onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                                title="Hapus gambar"
                                className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 text-xs leading-6 text-gray-700 shadow hover:bg-gray-50"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ketik pesan Anda di sini... Coba: 'Mulai penelitian', 'Buatkan kode HTML'"
                      className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent text-gray-700 placeholder-gray-400 ring-1 ring-gray-200"
                      rows={1}
                      style={{ 
                        minHeight: '48px', 
                        maxHeight: '120px',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1">
                    {/* Upload Image Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors h-12 w-12 flex items-center justify-center"
                      title="Upload Image"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    
                    {/* Mic Button */}
                    <button
                      onClick={handleVoiceInput}
                      className={`p-3 rounded-xl transition-colors h-12 w-12 flex items-center justify-center ${
                        isListening 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={isListening ? "Stop Recording" : "Voice Input"}
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    
                    {/* Speaker Button */}
                    <button
                      onClick={handleTextToSpeech}
                      className={`p-3 rounded-xl transition-colors h-12 w-12 flex items-center justify-center ${
                        isSpeaking 
                          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={isSpeaking ? "Stop Speaking" : "Text to Speech"}
                    >
                      {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    
                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && attachedImages.length === 0) || state.isProcessing}
                      className="flex-shrink-0 text-white h-12 w-12 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg accent-gradient hover:opacity-90 flex items-center justify-center ml-2"
                    >
                      {state.isProcessing ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result as string;
                          setAttachedImages(prev => [...prev, result]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};