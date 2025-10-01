// AI Service for client-side interactions with server API routes

export interface AIAction {
  type: 'navigate' | 'create' | 'modify' | 'suggest';
  payload: Record<string, string | number | boolean>;
}

export interface AIContext {
  currentPage: string;
  userHistory: string[];
  preferences: Record<string, string | number | boolean>;
}

export interface AIResponse {
  text: string;
  suggestions?: string[];
  actions?: AIAction[];
}

export interface NavigationItem {
  name: string;
  href: string;
  description: string;
  icon: string;
}

export interface DashboardWidget {
  type: string;
  title: string;
  data: Record<string, string | number>;
}

export interface DashboardContent {
  widgets: DashboardWidget[];
  insights: string[];
}

export interface BehaviorAnalysis {
  patterns: string[];
  recommendations: string[];
  adaptations: Array<{
    component: string;
    changes: Record<string, unknown>;
  }>;
}

class AIService {
  async generateResponse(prompt: string, context?: AIContext, imageData?: string, signal?: AbortSignal): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt, 
          context,
          imageData
        }),
        signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }
      
      return await response.json();
    } catch (error: unknown) {
      const err = error as { name?: string } | undefined;
      if (err?.name === 'AbortError') {
        return { text: 'Permintaan dibatalkan.' };
      }
      console.error('AI Service error:', error);
      return { 
        text: "I'm having trouble processing your request. Please try again.",
        suggestions: ["Try rephrasing your question", "Check your connection"]
      };
    }
  }
  
  async generateNavigationMenu(signal?: AbortSignal): Promise<NavigationItem[]> {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu');
      }
      
      return await response.json();
    } catch (error: unknown) {
      const err = error as { name?: string } | undefined;
      if (err?.name === 'AbortError') return [];
      console.error('Menu generation error:', error);
      return [
        { name: "AI Dashboard", href: "/dashboard", description: "AI-powered control center", icon: "brain" },
        { name: "AI Chat", href: "/chat", description: "Conversation with AI", icon: "message-circle" },
        { name: "Content Creator", href: "/create", description: "AI content generation", icon: "wand" },
        { name: "Analytics", href: "/analytics", description: "AI insights and analysis", icon: "bar-chart" }
      ];
    }
  }
  
  async generateDashboardContent(signal?: AbortSignal): Promise<DashboardContent> {
    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      
      return await response.json();
    } catch (error: unknown) {
      const err = error as { name?: string } | undefined;
      if (err?.name === 'AbortError') return { widgets: [], insights: [] };
      console.error('Dashboard generation error:', error);
      return {
        widgets: [
          { type: "ai-status", title: "AI Status", data: { status: "Active", requests: 42 } },
          { type: "content-created", title: "Content Created Today", data: { count: 15 } },
          { type: "user-interactions", title: "AI Interactions", data: { count: 128 } }
        ],
        insights: ["AI is learning from your patterns", "Content engagement up 25%", "New AI features available"]
      };
    }
  }
  
  async analyzeUserBehavior(interactions: Record<string, string | number>[], signal?: AbortSignal): Promise<BehaviorAnalysis> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `Analyze user behavior and provide personalized recommendations. User interactions: ${JSON.stringify(interactions)}`
        }),
        signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze behavior');
      }
      
      const data = await response.json();
      
      return {
        patterns: data.patterns || ["Regular usage patterns detected"],
        recommendations: data.recommendations || ["Continue current usage"],
        adaptations: data.adaptations || []
      };
    } catch (error: unknown) {
      const err = error as { name?: string } | undefined;
      if (err?.name === 'AbortError') return { patterns: [], recommendations: [], adaptations: [] };
      console.error('Behavior analysis error:', error);
      return { 
        patterns: ["Regular usage in evening", "Prefers visual content"],
        recommendations: ["Enable dark mode", "Show more visual elements"],
        adaptations: []
      };
    }
  }
}

export const aiService = new AIService();
export const createAbortController = () => new AbortController();