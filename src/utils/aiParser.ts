import { ResearchTitleSuggestion } from '../types/chat';
import { cleanText } from './research';

// Function to parse AI response and extract research titles with detailed information
export const parseAIResponseForTitles = (aiResponse: string): ResearchTitleSuggestion[] => {
  const titles: ResearchTitleSuggestion[] = [];
  
  // Enhanced parsing - extract comprehensive information from AI response
  const lines = aiResponse.split('\n');
  let currentTitle = '';
  let currentDescription = '';
  let currentField = 'Multidisiplin';
  let currentComplexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  let currentDuration = '6-8 bulan';
  let currentKeywords: string[] = ['Penelitian', 'Inovasi'];
  let currentScope = '';
  let currentMethodology = '';
  let currentExpectedResults = '';
  let currentDataSources: string[] = [];
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
    
    // Skip header lines with emoji and introductory text
    const isHeaderWithEmoji = /[✨🎯🔬📚⭐]/g.test(trimmedLine);
    const isIntroductoryHeader = lowerLine.includes('ide judul') || lowerLine.includes('pilihan judul') || lowerLine.includes('judul penelitian') && (lowerLine.includes('alternatif') || lowerLine.includes('inovatif') || lowerLine.includes('berikut'));
    if (isHeaderWithEmoji || isIntroductoryHeader) return;
    
    // Look for actual research titles with better detection
    const isNumberedTitle = trimmedLine.match(/^\d+\.\s*(.+)/) && trimmedLine.length > 15;
    const isBoldTitle = trimmedLine.includes('**') && trimmedLine.length > 20;
    const isQuotedTitle = (trimmedLine.includes('"') || trimmedLine.includes('"') || trimmedLine.includes('"')) && trimmedLine.length > 15;
    const isHeaderTitle = trimmedLine.match(/^#{1,4}\s+/) && trimmedLine.length > 15;
    const isBulletTitle = trimmedLine.match(/^[-*]\s+/) && trimmedLine.length > 15;
    
    // Additional criteria for detecting research titles
    const hasResearchWords = /\b(analisis|implementasi|pengembangan|pengaruh|hubungan|perancangan|evaluasi|studi|kajian|optimasi|pemanfaatan|penerapan|sistem|aplikasi|model|prediksi)\b/i.test(trimmedLine);
    const hasMethodWords = /\b(machine learning|deep learning|ai|artificial intelligence|blockchain|iot|algoritma|metode|teknik|teknologi|otomatis)\b/i.test(trimmedLine);
    
    if ((isNumberedTitle || isBoldTitle || isQuotedTitle || isHeaderTitle || isBulletTitle) && 
        (hasResearchWords || hasMethodWords || trimmedLine.length > 30)) {
      if (currentTitle) {
        // Save previous title
        titles.push({
          id: Date.now().toString() + titleCounter,
          title: cleanText(currentTitle),
          description: currentDescription.trim() || generateSmartDescription(currentTitle),
          field: currentField,
          complexity: currentComplexity,
          estimatedDuration: currentDuration,
          keywords: currentKeywords,
          scope: currentScope || generateDynamicScope(currentTitle, currentField),
          methodology: currentMethodology || generateDynamicMethodology(currentTitle, currentComplexity),
          expectedResults: currentExpectedResults || generateDynamicExpectedResults(currentTitle),
          dataSources: currentDataSources.length > 0 ? currentDataSources : generateDataSources(currentField)
        });
        titleCounter++;
      }
      
      // Extract new title - clean it from symbols
      currentTitle = cleanText(trimmedLine);
      
      // Reset for new title
      currentDescription = '';
      currentField = detectFieldFromTitle(currentTitle);
      currentComplexity = detectComplexityFromTitle(currentTitle);
      currentDuration = generateDurationFromComplexity(currentComplexity);
      currentKeywords = extractKeywordsFromTitle(currentTitle);
      
      // Process subsequent lines for description and metadata
      processTitleMetadata(lines, index, currentTitle, (metadata) => {
        if (metadata.description.trim()) {
          currentDescription = metadata.description;
        }
        if (metadata.field !== 'Multidisiplin') {
          currentField = metadata.field;
        }
        currentComplexity = metadata.complexity;
        currentDuration = metadata.duration;
        if (metadata.keywords.length > 2) {
          currentKeywords = metadata.keywords;
        }
      });
    }
  });
  
  // Add the last title if exists
  if (currentTitle) {
    titles.push({
      id: Date.now().toString() + titleCounter,
      title: cleanText(currentTitle),
      description: currentDescription.trim() || generateSmartDescription(currentTitle),
      field: currentField,
      complexity: currentComplexity,
      estimatedDuration: currentDuration,
      keywords: currentKeywords,
      scope: currentScope || generateDynamicScope(currentTitle, currentField),
      methodology: currentMethodology || generateDynamicMethodology(currentTitle, currentComplexity),
      expectedResults: currentExpectedResults || generateDynamicExpectedResults(currentTitle),
      dataSources: currentDataSources.length > 0 ? currentDataSources : generateDataSources(currentField)
    });
  }
  
  return titles;
};

// Helper function to process title metadata
const processTitleMetadata = (
  lines: string[], 
  startIndex: number, 
  title: string,
  callback: (metadata: {
    description: string;
    field: string;
    complexity: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    keywords: string[];
  }) => void
) => {
  let description = '';
  let field = 'Multidisiplin';
  let complexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  let duration = '6-8 bulan';
  let keywords: string[] = ['Penelitian', 'Inovasi'];
  
  const excludePatterns = [
    'deskripsi', 'description', 'tingkat kompleksitas', 'kompleksitas', 'complexity',
    'estimasi durasi', 'durasi', 'duration', 'kata kunci', 'keywords', 'bidang',
    'field', 'pilih judul', 'klik pada', 'memilihnya', 'melanjutkan', 'pencarian jurnal'
  ];
  
  // Look for description and other details in next lines
  for (let i = startIndex + 1; i < Math.min(startIndex + 8, lines.length); i++) {
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
      description += cleanText(nextLine) + ' ';
    }
    
    // Extract field
    if (nextLine.includes('Bidang') || nextLine.includes('Field')) {
      const fieldMatch = nextLine.match(/(?:Bidang|Field)[^:]*:\s*(.+)/);
      if (fieldMatch) {
        field = fieldMatch[1].trim();
      }
    }
    
    // Extract complexity - more flexible parsing
    if (nextLine.includes('Kompleksitas') || nextLine.includes('Tingkat') || 
        nextLowerLine.includes('complexity') || nextLowerLine.includes('kesulitan')) {
      if (nextLowerLine.includes('tinggi') || nextLowerLine.includes('lanjut') || 
          nextLowerLine.includes('advanced') || nextLowerLine.includes('sulit') || 
          nextLowerLine.includes('kompleks')) {
        complexity = 'advanced';
      } else if (nextLowerLine.includes('sedang') || nextLowerLine.includes('menengah') || 
                 nextLowerLine.includes('intermediate') || nextLowerLine.includes('medium')) {
        complexity = 'intermediate';
      } else if (nextLowerLine.includes('pemula') || nextLowerLine.includes('beginner') || 
                 nextLowerLine.includes('mudah') || nextLowerLine.includes('dasar') || 
                 nextLowerLine.includes('rendah')) {
        complexity = 'beginner';
      }
    }
    
    // Extract duration - more flexible parsing
    if (nextLine.includes('Durasi') || nextLine.includes('Estimasi') || 
        nextLowerLine.includes('duration') || nextLowerLine.includes('waktu') ||
        nextLine.match(/\d+[-–]\d+\s*(bulan|tahun|month|year)/i)) {
      // Try to find duration patterns like "6-8 bulan", "10-12 months", "8 bulan", etc.
      const durationMatch = nextLine.match(/(\d+[-–]\d+\s*(?:bulan|tahun|month|year))/i) ||
                           nextLine.match(/(\d+\s*(?:bulan|tahun|month|year))/i);
      if (durationMatch) {
        duration = durationMatch[1];
      }
    }
    
    // Extract keywords
    if (nextLine.includes('Kata Kunci') || nextLine.includes('Keywords')) {
      const keywordMatch = nextLine.match(/(?:Kata Kunci|Keywords)[^:]*:\s*(.+)/);
      if (keywordMatch) {
        keywords = keywordMatch[1].split(',').map(k => k.trim()).slice(0, 5);
      }
    }
  }
  
  // Auto-detect field from title content
  field = autoDetectField(title);
  
  // Auto-detect complexity from title characteristics
  complexity = autoDetectComplexity(title);
  
  // Auto-extract keywords from title
  keywords = autoExtractKeywords(title);
  
  callback({ description, field, complexity, duration, keywords });
};

// Auto-detect field from title content
const autoDetectField = (title: string): string => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('ai ') || titleLower.includes('artificial intelligence') || 
      titleLower.includes('machine learning') || titleLower.includes('deep learning') ||
      titleLower.includes('neural network')) {
    return 'Kecerdasan Buatan';
  } else if (titleLower.includes('blockchain') || titleLower.includes('sistem informasi') ||
             titleLower.includes('teknologi informasi') || titleLower.includes('software') ||
             titleLower.includes('aplikasi') || titleLower.includes('database')) {
    return 'Teknologi Informasi';
  } else if (titleLower.includes('ekonomi') || titleLower.includes('bisnis') ||
             titleLower.includes('keuangan') || titleLower.includes('manajemen') ||
             titleLower.includes('marketing') || titleLower.includes('e-commerce')) {
    return 'Ekonomi dan Bisnis';
  } else if (titleLower.includes('kesehatan') || titleLower.includes('medis') ||
             titleLower.includes('kedokteran') || titleLower.includes('farmasi') ||
             titleLower.includes('biomedis')) {
    return 'Kesehatan';
  } else if (titleLower.includes('pendidikan') || titleLower.includes('pembelajaran') ||
             titleLower.includes('edukasi') || titleLower.includes('kurikulum') ||
             titleLower.includes('teaching')) {
    return 'Pendidikan';
  } else if (titleLower.includes('lingkungan') || titleLower.includes('energi') ||
             titleLower.includes('sustainability') || titleLower.includes('renewable')) {
    return 'Lingkungan dan Energi';
  } else if (titleLower.includes('teknik') || titleLower.includes('engineering') ||
             titleLower.includes('industri') || titleLower.includes('manufaktur')) {
    return 'Teknik dan Industri';
  }
  
  return 'Multidisiplin';
};

// Auto-detect complexity from title characteristics
const autoDetectComplexity = (title: string): 'beginner' | 'intermediate' | 'advanced' => {
  const titleLower = title.toLowerCase();
  
  if (title.length > 120 || titleLower.includes('optimasi') || 
      titleLower.includes('neural') || titleLower.includes('quantum') ||
      titleLower.includes('advanced') || titleLower.includes('hybrid')) {
    return 'advanced';
  } else if (title.length < 70 || titleLower.includes('analisis') || 
             titleLower.includes('implementasi') || titleLower.includes('pengembangan')) {
    return 'intermediate';
  }
  
  return 'intermediate';
};

// Auto-extract keywords from title
const autoExtractKeywords = (title: string): string[] => {
  const titleWords = title.toLowerCase().split(' ');
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
    return [...new Set([...foundTechKeywords.slice(0, 3), 'Penelitian', 'Inovasi'])].slice(0, 5);
  }
  
  return ['Penelitian', 'Inovasi'];
};

// Helper functions for smart parsing
const generateSmartDescription = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('implementasi')) {
    return `Penelitian ini fokus pada implementasi dan pengembangan ${title.toLowerCase()}. Penelitian akan melibatkan analisis mendalam, perancangan sistem, dan evaluasi kinerja untuk menghasilkan solusi yang efektif dan efisien.`;
  } else if (lowerTitle.includes('analisis')) {
    return `Studi analitis mendalam tentang ${title.toLowerCase()}. Penelitian akan menggunakan metode analisis yang komprehensif untuk memahami pola, trend, dan insight yang dapat memberikan kontribusi signifikan bagi bidang terkait.`;
  } else if (lowerTitle.includes('pengembangan')) {
    return `Penelitian pengembangan yang bertujuan untuk menciptakan ${title.toLowerCase()}. Melibatkan proses desain, prototyping, testing, dan optimasi untuk menghasilkan inovasi yang applicable dan bermanfaat.`;
  } else if (lowerTitle.includes('pengaruh') || lowerTitle.includes('hubungan')) {
    return `Penelitian kuantitatif yang mengeksplorasi ${title.toLowerCase()}. Menggunakan metodologi penelitian yang rigorous untuk mengidentifikasi korelasi, kausalitas, dan dampak signifikan antar variabel.`;
  } else if (lowerTitle.includes('optimasi') || lowerTitle.includes('peningkatan')) {
    return `Penelitian optimasi yang bertujuan untuk meningkatkan ${title.toLowerCase()}. Fokus pada efisiensi, performance improvement, dan best practices untuk mencapai hasil yang optimal.`;
  } else {
    return `Penelitian inovatif tentang ${title.toLowerCase()}. Studi komprehensif yang menggabungkan teori dan praktik untuk menghasilkan kontribusi ilmiah yang signifikan dan aplikatif di bidang terkait.`;
  }
};

const detectFieldFromTitle = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('ai') || lowerTitle.includes('artificial intelligence') || 
      lowerTitle.includes('machine learning') || lowerTitle.includes('deep learning') ||
      lowerTitle.includes('neural network') || lowerTitle.includes('computer vision')) {
    return 'Kecerdasan Buatan';
  } else if (lowerTitle.includes('sistem') || lowerTitle.includes('software') || 
             lowerTitle.includes('aplikasi') || lowerTitle.includes('web') || lowerTitle.includes('mobile')) {
    return 'Teknologi Informasi';
  } else if (lowerTitle.includes('ekonomi') || lowerTitle.includes('bisnis') || 
             lowerTitle.includes('financial') || lowerTitle.includes('market')) {
    return 'Ekonomi dan Bisnis';
  } else if (lowerTitle.includes('kesehatan') || lowerTitle.includes('medis') || 
             lowerTitle.includes('health') || lowerTitle.includes('medical')) {
    return 'Kesehatan';
  } else if (lowerTitle.includes('pendidikan') || lowerTitle.includes('education') || 
             lowerTitle.includes('pembelajaran') || lowerTitle.includes('learning')) {
    return 'Pendidikan';
  } else if (lowerTitle.includes('lingkungan') || lowerTitle.includes('environment') || 
             lowerTitle.includes('energi') || lowerTitle.includes('energy')) {
    return 'Lingkungan dan Energi';
  } else if (lowerTitle.includes('industri') || lowerTitle.includes('manufaktur') || 
             lowerTitle.includes('teknik') || lowerTitle.includes('engineering')) {
    return 'Teknik dan Industri';
  } else {
    return 'Multidisiplin';
  }
};

const detectComplexityFromTitle = (title: string): 'beginner' | 'intermediate' | 'advanced' => {
  const lowerTitle = title.toLowerCase();
  
  // Advanced indicators
  if (lowerTitle.includes('optimasi') || lowerTitle.includes('deep learning') || 
      lowerTitle.includes('neural network') || lowerTitle.includes('blockchain') ||
      lowerTitle.includes('reinforcement learning') || lowerTitle.includes('quantum') ||
      lowerTitle.includes('big data') || lowerTitle.includes('complex')) {
    return 'advanced';
  }
  
  // Beginner indicators
  if (lowerTitle.includes('survey') || lowerTitle.includes('overview') || 
      lowerTitle.includes('pengenalan') || lowerTitle.includes('dasar') ||
      lowerTitle.includes('basic') || lowerTitle.includes('fundamental')) {
    return 'beginner';
  }
  
  // Default to intermediate
  return 'intermediate';
};

const generateDurationFromComplexity = (complexity: 'beginner' | 'intermediate' | 'advanced'): string => {
  switch (complexity) {
    case 'beginner': return '4-6 bulan';
    case 'intermediate': return '6-8 bulan';
    case 'advanced': return '8-12 bulan';
    default: return '6-8 bulan';
  }
};

const extractKeywordsFromTitle = (title: string): string[] => {
  const keywords: string[] = ['Penelitian', 'Inovasi'];
  const lowerTitle = title.toLowerCase();
  
  // Technical keywords
  const techTerms = [
    'AI', 'Machine Learning', 'Deep Learning', 'Blockchain', 'IoT', 'Big Data',
    'Cloud Computing', 'Mobile Development', 'Web Development', 'Database',
    'Security', 'Algoritma', 'Optimasi', 'Sistem', 'Aplikasi'
  ];
  
  techTerms.forEach(term => {
    if (lowerTitle.includes(term.toLowerCase())) {
      keywords.push(term);
    }
  });
  
  // Research method keywords
  if (lowerTitle.includes('analisis')) keywords.push('Analisis');
  if (lowerTitle.includes('implementasi')) keywords.push('Implementasi');
  if (lowerTitle.includes('pengembangan')) keywords.push('Pengembangan');
  if (lowerTitle.includes('evaluasi')) keywords.push('Evaluasi');
  if (lowerTitle.includes('perancangan')) keywords.push('Perancangan');
  
  return keywords.slice(0, 6);
};

// Dynamic content generators based on title analysis
const generateDynamicScope = (title: string, field: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('ai') || lowerTitle.includes('machine learning')) {
    return 'Penelitian yang mengintegrasikan teknik kecerdasan buatan dan pembelajaran mesin untuk menganalisis data kompleks dan menghasilkan insight yang dapat ditindaklanjuti dalam konteks aplikasi dunia nyata.';
  } else if (lowerTitle.includes('sistem') || lowerTitle.includes('aplikasi')) {
    return 'Penelitian yang berfokus pada pengembangan sistem teknologi informasi yang efisien, user-friendly, dan dapat memberikan solusi optimal untuk kebutuhan pengguna dan organisasi.';
  } else if (lowerTitle.includes('analisis') || lowerTitle.includes('evaluasi')) {
    return 'Penelitian analitis komprehensif yang menggunakan metodologi penelitian kuantitatif dan kualitatif untuk memahami fenomena, mengidentifikasi pola, dan menghasilkan rekomendasi berbasis bukti.';
  } else if (lowerTitle.includes('ekonomi') || lowerTitle.includes('bisnis')) {
    return 'Penelitian yang mengeksplorasi dinamika ekonomi dan bisnis modern, menganalisis tren pasar, perilaku konsumen, dan strategi bisnis untuk menghasilkan insight strategis.';
  } else {
    return `Penelitian interdisipliner di bidang ${field} yang menggabungkan teori dan praktik untuk menghasilkan kontribusi ilmiah yang signifikan dan aplikatif dalam memecahkan masalah nyata.`;
  }
};

const generateDynamicMethodology = (title: string, complexity: 'beginner' | 'intermediate' | 'advanced'): string => {
  const lowerTitle = title.toLowerCase();
  
  let baseMethods = [];
  
  if (lowerTitle.includes('ai') || lowerTitle.includes('machine learning') || lowerTitle.includes('deep learning')) {
    baseMethods = ['Algoritma machine learning', 'Deep learning networks', 'Data preprocessing dan feature engineering', 'Model training dan validation'];
  } else if (lowerTitle.includes('sistem') || lowerTitle.includes('aplikasi')) {
    baseMethods = ['System design dan architecture', 'Prototyping dan iterative development', 'User testing dan usability analysis', 'Performance testing dan optimization'];
  } else if (lowerTitle.includes('analisis') || lowerTitle.includes('evaluasi')) {
    baseMethods = ['Analisis statistik deskriptif dan inferensial', 'Survei dan kuesioner terstruktur', 'Wawancara mendalam', 'Analisis data kualitatif dan kuantitatif'];
  } else if (lowerTitle.includes('ekonomi') || lowerTitle.includes('bisnis')) {
    baseMethods = ['Analisis ekonometrik', 'Studi kasus komparatif', 'Survei pasar dan konsumen', 'Analisis tren dan forecasting'];
  } else {
    baseMethods = ['Mixed-method research approach', 'Literature review sistematis', 'Data collection dan analysis', 'Validasi hasil penelitian'];
  }
  
  if (complexity === 'advanced') {
    baseMethods.push('Advanced statistical modeling', 'Experimental design yang kompleks');
  } else if (complexity === 'beginner') {
    baseMethods = baseMethods.slice(0, 2).concat(['Observasi terstruktur', 'Analisis data sederhana']);
  }
  
  return `Metodologi yang disarankan: ${baseMethods.join(', ')}.`;
};

const generateDynamicExpectedResults = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  let outcomes = [];
  
  if (lowerTitle.includes('implementasi') || lowerTitle.includes('pengembangan')) {
    outcomes = ['Prototipe atau sistem yang berfungsi', 'Framework atau model yang dapat direplikasi', 'Peningkatan efisiensi atau performance yang terukur'];
  } else if (lowerTitle.includes('analisis') || lowerTitle.includes('evaluasi')) {
    outcomes = ['Insight dan temuan penelitian yang signifikan', 'Rekomendasi berbasis bukti empiris', 'Model prediktif atau explanatory yang validated'];
  } else if (lowerTitle.includes('pengaruh') || lowerTitle.includes('hubungan')) {
    outcomes = ['Identifikasi korelasi dan kausalitas yang kuat', 'Pemahaman mendalam tentang faktor-faktor berpengaruh', 'Model hubungan yang dapat digeneralisasi'];
  } else {
    outcomes = ['Kontribusi teoretis dan praktis yang inovatif', 'Solusi yang dapat diimplementasikan', 'Publikasi di venue ilmiah yang bereputasi'];
  }
  
  return `Hasil yang diharapkan: ${outcomes.join(', ')}.`;
};

const generateDataSources = (field: string): string[] => {
  const dataSources: { [key: string]: string[] } = {
    'Kecerdasan Buatan': [
      'Dataset publik (UCI, Kaggle, GitHub)',
      'API data dari platform teknologi',
      'Sensor data dan IoT devices',
      'Social media dan web scraping data'
    ],
    'Teknologi Informasi': [
      'Database sistem organisasi',
      'Log files dan performance metrics',
      'User behavior analytics',
      'Survey data dari pengguna sistem'
    ],
    'Ekonomi dan Bisnis': [
      'Database ekonomi nasional (BPS, BI)',
      'Laporan keuangan perusahaan',
      'Survey konsumen dan pasar',
      'Data transaksi dan penjualan'
    ],
    'Kesehatan': [
      'Rekam medis elektronik (dengan persetujuan)',
      'Database kesehatan publik',
      'Clinical trial data',
      'Survey kesehatan masyarakat'
    ],
    'Pendidikan': [
      'Data akademik siswa/mahasiswa',
      'Platform pembelajaran online',
      'Survey kepuasan dan efektivitas',
      'Observasi classroom dan interview'
    ],
    'Multidisiplin': [
      'Multiple data sources sesuai aspek penelitian',
      'Primary data melalui survey dan interview',
      'Secondary data dari publikasi ilmiah',
      'Open data dari institusi pemerintah'
    ]
  };
  
  return dataSources[field] || dataSources['Multidisiplin'];
};