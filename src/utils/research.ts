import { ResearchTitleSuggestion } from '../types/chat';

// Function to clean text from markdown symbols
export const cleanText = (text: string): string => {
  return text
    .replace(/^\d+\.\s*/, '') // Remove numbering
    .replace(/^#{1,6}\s*/, '') // Remove headers
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '') // Remove italic
    .replace(/`/g, '') // Remove code backticks
    .replace(/^\s*[-*+]\s*/, '') // Remove list markers
    .replace(/^\s*\d+\.\s*/, '') // Remove numbered list
    .replace(/["'"'"]/g, '') // Remove quotes
    .trim();
};

// Function to get comprehensive description for research suggestion
export const getComprehensiveDescription = (suggestion: ResearchTitleSuggestion): string => {
  const baseDesc = suggestion.description || 'Penelitian yang menarik dan layak untuk diteliti lebih lanjut.';
  
  const complexityDesc = {
    'beginner': 'Penelitian tingkat pemula yang cocok untuk mahasiswa S1 atau peneliti baru.',
    'intermediate': 'Penelitian tingkat menengah yang membutuhkan pemahaman mendalam tentang metodologi.',
    'advanced': 'Penelitian tingkat lanjut yang memerlukan keahlian khusus dan analisis kompleks.'
  };
  
  return `${baseDesc} ${complexityDesc[suggestion.complexity]} Estimasi waktu penelitian: ${suggestion.estimatedDuration}.`;
};

// Function to get research scope description
export const getResearchScope = (suggestion: ResearchTitleSuggestion): string => {
  const scopes = {
    'Kecerdasan Buatan': 'Mengeksplorasi algoritma pembelajaran mesin, neural networks, dan aplikasi AI dalam berbagai domain.',
    'Teknologi Informasi': 'Mengkaji sistem informasi, pengembangan software, dan infrastruktur teknologi.',
    'Ekonomi dan Bisnis': 'Menganalisis aspek ekonomi, model bisnis, dan dampak terhadap industri.',
    'Kesehatan': 'Meneliti aplikasi teknologi dalam bidang medis dan kesehatan masyarakat.',
    'Pendidikan': 'Mengkaji implementasi teknologi dalam proses pembelajaran dan pendidikan.',
    'Lingkungan dan Energi': 'Meneliti solusi berkelanjutan dan teknologi ramah lingkungan.',
    'Teknik dan Industri': 'Mengeksplorasi inovasi dalam proses industri dan teknologi manufaktur.',
    'Multidisiplin': 'Penelitian yang menggabungkan berbagai bidang ilmu untuk solusi holistik.'
  };
  
  return scopes[suggestion.field as keyof typeof scopes] || scopes['Multidisiplin'];
};

// Function to get methodology approach description
export const getMethodologyApproach = (suggestion: ResearchTitleSuggestion): string => {
  const methodologies = {
    'beginner': [
      'Studi literatur komprehensif',
      'Survei dan kuesioner',
      'Analisis deskriptif',
      'Prototype sederhana',
      'Observasi dan dokumentasi'
    ],
    'intermediate': [
      'Eksperimen terkontrol',
      'Analisis statistik lanjutan',
      'Pengembangan model/algoritma',
      'Implementasi sistem',
      'Validasi dan testing',
      'Analisis perbandingan'
    ],
    'advanced': [
      'Machine learning dan deep learning',
      'Optimasi algoritma kompleks',
      'Simulasi dan pemodelan matematika',
      'Analisis big data',
      'Penelitian eksperimental skala besar',
      'Pengembangan framework inovatif'
    ]
  };
  
  const methods = methodologies[suggestion.complexity];
  return `Metodologi yang disarankan: ${methods.slice(0, 3).join(', ')}.`;
};

// Function to get expected outcomes description
export const getExpectedOutcomes = (suggestion: ResearchTitleSuggestion): string => {
  const outcomes = {
    'Kecerdasan Buatan': [
      'Model AI dengan akurasi tinggi',
      'Algoritma yang efisien',
      'Aplikasi AI yang inovatif',
      'Framework pembelajaran mesin',
      'Publikasi di jurnal AI terkemuka'
    ],
    'Teknologi Informasi': [
      'Sistem informasi yang robust',
      'Aplikasi software yang user-friendly',
      'Arsitektur sistem yang scalable',
      'Dokumentasi teknis lengkap',
      'Kontribusi open source'
    ],
    'Ekonomi dan Bisnis': [
      'Model bisnis yang validated',
      'Analisis ROI yang komprehensif',
      'Strategi implementasi',
      'Rekomendasi kebijakan',
      'Dampak ekonomi yang terukur'
    ]
  };
  
  const fieldOutcomes = outcomes[suggestion.field as keyof typeof outcomes] || [
    'Kontribusi ilmiah yang signifikan',
    'Solusi inovatif untuk masalah nyata',
    'Publikasi di jurnal bereputasi',
    'Prototype atau model yang fungsional',
    'Rekomendasi untuk penelitian lanjutan'
  ];
  
  return `Hasil yang diharapkan: ${fieldOutcomes.slice(0, 3).join(', ')}.`;
};