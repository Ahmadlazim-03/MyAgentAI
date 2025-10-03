export interface ResearchTitleSuggestion {
  id: string;
  title: string;
  description: string;
  field: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  keywords: string[];
  isSelected?: boolean;
}

export interface Message {
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

export type ResearchStep = 'initial' | 'title' | 'title-input' | 'journals' | 'analysis' | 'references' | 'writing';