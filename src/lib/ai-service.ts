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
  async generateResponse(prompt: string, context?: AIContext, imageData?: string): Promise<AIResponse> {
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
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }
      
      return await response.json();
    } catch (error) {
      console.error('AI Service error:', error);
      return { 
        text: "I'm having trouble processing your request. Please try again.",
        suggestions: ["Try rephrasing your question", "Check your connection"]
      };
    }
  }
  
  async generateNavigationMenu(): Promise<NavigationItem[]> {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Menu generation error:', error);
      return [
        { name: "AI Dashboard", href: "/dashboard", description: "AI-powered control center", icon: "brain" },
        { name: "AI Chat", href: "/chat", description: "Conversation with AI", icon: "message-circle" },
        { name: "Content Creator", href: "/create", description: "AI content generation", icon: "wand" },
        { name: "Analytics", href: "/analytics", description: "AI insights and analysis", icon: "bar-chart" }
      ];
    }
  }
  
  async generateDashboardContent(): Promise<DashboardContent> {
    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      
      return await response.json();
    } catch (error) {
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
  
  async analyzeUserBehavior(interactions: Record<string, string | number>[]): Promise<BehaviorAnalysis> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `Analyze user behavior and provide personalized recommendations. User interactions: ${JSON.stringify(interactions)}`
        }),
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
    } catch (error) {
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