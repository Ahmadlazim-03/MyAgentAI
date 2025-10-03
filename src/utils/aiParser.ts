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
      
      // Process subsequent lines for metadata
      processTitleMetadata(lines, index, currentTitle, (metadata) => {
        currentDescription = metadata.description;
        currentField = metadata.field;
        currentComplexity = metadata.complexity;
        currentDuration = metadata.duration;
        currentKeywords = metadata.keywords;
      });
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
    
    // Extract complexity
    if (nextLine.includes('Kompleksitas') || nextLine.includes('Tingkat')) {
      if (nextLowerLine.includes('tinggi') || nextLowerLine.includes('advanced')) {
        complexity = 'advanced';
      } else if (nextLowerLine.includes('sedang') || nextLowerLine.includes('intermediate')) {
        complexity = 'intermediate';
      } else if (nextLowerLine.includes('pemula') || nextLowerLine.includes('beginner')) {
        complexity = 'beginner';
      }
    }
    
    // Extract duration
    if (nextLine.includes('Durasi') || nextLine.includes('Estimasi') || nextLine.match(/\d+-\d+\s*(bulan|month)/)) {
      const durationMatch = nextLine.match(/(\d+-\d+\s*(?:bulan|month))/);
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