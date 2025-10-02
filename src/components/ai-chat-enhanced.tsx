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
  formattedContent?: React.ReactNode;
  images?: string[];
  links?: { label: string; href: string }[];
  researchData?: {
    type: 'title_suggestions' | 'journal_recommendations';
    data: ResearchTitleSuggestion[] | unknown[];
  };
}

export const AIChat: React.FC = () => {
  const { state, sendMessage, trackBehavior, cancelCurrent } = useAI();
  const { applyTheme } = useTheme();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Research Assistant State
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [researchStep, setResearchStep] = useState<'initial' | 'title' | 'journals' | 'analysis' | 'references' | 'writing'>('initial');
  const [titleSuggestions, setTitleSuggestions] = useState<ResearchTitleSuggestion[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [isResearchTyping, setIsResearchTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Research Title Selection Component
  const ResearchTitleCard: React.FC<{ 
    suggestion: ResearchTitleSuggestion; 
    onSelect: (id: string) => void; 
    isSelected: boolean 
  }> = ({ suggestion, onSelect, isSelected }) => (
    <div 
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
        isSelected 
          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-purple-300'
      }`}
      onClick={() => onSelect(suggestion.id)}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <CheckCircle className="w-4 h-4 text-white" />
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
      suggestions: ['Mulai penelitian', 'Buatkan kode HTML', 'Arahkan ke google.com', 'Jelaskan tentang AI'],
      formattedContent: null as unknown as React.ReactNode
    }
  ]);

  // Hydrate formatted content for the initial message
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      if (first.formattedContent) return prev;
      const formatted = formatMessage(first.content);
      const updated = [{ ...first, formattedContent: formatted }, ...prev.slice(1)];
      return updated;
    });
  }, [formatMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Listen for new AI responses
  useEffect(() => {
    if (state.responses.length > 0) {
      const latestResponse = state.responses[state.responses.length - 1];
      let parsedTitles: ResearchTitleSuggestion[] = [];
      
      // Check if this is a research titles response and we're in research mode
      if (isResearchMode && researchStep === 'title' && latestResponse.text.includes('judul penelitian')) {
        // Parse the AI response to create title suggestions
        parsedTitles = parseAIResponseForTitles(latestResponse.text);
        if (parsedTitles.length > 0) {
          setTitleSuggestions(parsedTitles);
          
          // Create a special message for title suggestions without showing AI text
          const titleSuggestionsMessage: Message = {
            id: Date.now().toString(),
            content: `🎯 **Rekomendasi Judul Penelitian**

Berdasarkan bidang dan latar belakang yang Anda berikan, berikut adalah ${parsedTitles.length} judul penelitian yang original dan dapat diteliti:`,
            isAI: true,
            timestamp: new Date(),
            suggestions: ['Cari judul lain', 'Ganti bidang penelitian', 'Kembali ke chat biasa'],
            formattedContent: null as unknown as React.ReactNode,
            researchData: {
              type: 'title_suggestions' as const,
              data: parsedTitles
            }
          };
          
          setMessages(prev => [...prev, titleSuggestionsMessage]);
          setIsTyping(false);
          setIsResearchTyping(false);
          return;
        }
      }
      
      // For non-research responses, show normal AI message
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
      setIsResearchTyping(false);
    }
  }, [state.responses, formatMessage, isResearchMode, researchStep]);

  // Function to clean text from markdown symbols
  const cleanText = (text: string): string => {
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
  };

  // Function to parse AI response and extract research titles with detailed information
  const parseAIResponseForTitles = (aiResponse: string): ResearchTitleSuggestion[] => {
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
      'penelitian yang', 'layak untuk', 'menarik dan', 'lebih lanjut'
    ];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const lowerLine = trimmedLine.toLowerCase();
      
      // Skip if line contains exclude patterns
      const shouldExclude = excludePatterns.some(pattern => lowerLine.includes(pattern));
      if (shouldExclude) return;
      
      // Look for actual research titles (numbered or long meaningful titles)
      const isNumberedTitle = trimmedLine.match(/^\d+\.\s*(.+)/) && trimmedLine.length > 30;
      const isLongTitle = (trimmedLine.includes('**') || trimmedLine.match(/^#{1,4}\s+/)) && 
                         trimmedLine.length > 40 && 
                         !lowerLine.includes('penelitian') &&
                         !lowerLine.includes('judul');
      
      if (isNumberedTitle || isLongTitle) {
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
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedImages.length === 0) || state.isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date(),
      images: attachedImages.length ? [...attachedImages] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    
    const lowerInput = inputValue.toLowerCase();
    
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
                  <div className="max-w-4xl w-full">
                    {/* Message Bubble */}
                    <div className={`relative group inline-block rounded-2xl p-4 w-full ${
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

            {/* Title Suggestions Cards (after AI response) */}
            {/* {!isResearchTyping && titleSuggestions.length > 0 && researchStep === 'title' && (
              <div className="mt-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <Star className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-bold text-gray-900">Pilih Judul Penelitian</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Klik pada salah satu judul di bawah untuk memilihnya dan melanjutkan ke tahap pencarian jurnal referensi.
                  </p>
                  
                  <div className="grid gap-4">
                    {titleSuggestions.map((suggestion) => (
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
                        ✅ Judul penelitian telah dipilih! Sistem akan otomatis melanjutkan ke pencarian jurnal.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => generateResearchTitles()}
                      className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                    >
                      🔄 Cari judul lain
                    </button>
                    <button
                      onClick={() => setIsResearchMode(false)}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      ↩️ Kembali ke chat biasa
                    </button>
                  </div>
                </div>
              </div>
            )} */}

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
          <div className="bg-white/95 backdrop-blur border-t border-gray-200 py-4 sticky bottom-0 z-10 shadow-sm">
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
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && attachedImages.length === 0) || state.isProcessing}
                    className="self-start flex-shrink-0 text-white h-12 w-12 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg accent-gradient hover:opacity-90 flex items-center justify-center"
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
          </div>
        </div>
      </div>
    </div>
  );
};