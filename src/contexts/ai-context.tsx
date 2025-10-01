'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { aiService, AIResponse, type AIContext as AIContextType, NavigationItem, DashboardContent } from '@/lib/ai-service';

interface AIState {
  isProcessing: boolean;
  responses: AIResponse[];
  context: AIContextType;
  menuItems: NavigationItem[];
  dashboardData: DashboardContent;
  userBehavior: Record<string, string | number>[];
  adaptations: Array<{
    component: string;
    changes: Record<string, unknown>;
  }>;
}

type AIAction = 
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'ADD_RESPONSE'; payload: AIResponse }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<AIContextType> }
  | { type: 'SET_MENU'; payload: NavigationItem[] }
  | { type: 'SET_DASHBOARD'; payload: DashboardContent }
  | { type: 'ADD_BEHAVIOR'; payload: Record<string, string | number> }
  | { type: 'SET_ADAPTATIONS'; payload: Array<{ component: string; changes: Record<string, unknown> }> };

const initialState: AIState = {
  isProcessing: false,
  responses: [],
  context: {
    currentPage: '/',
    userHistory: [],
    preferences: {}
  },
  menuItems: [],
  dashboardData: {
    widgets: [],
    insights: []
  },
  userBehavior: [],
  adaptations: []
};

const aiReducer = (state: AIState, action: AIAction): AIState => {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'ADD_RESPONSE':
      return { ...state, responses: [...state.responses, action.payload] };
    case 'UPDATE_CONTEXT':
      return { ...state, context: { ...state.context, ...action.payload } };
    case 'SET_MENU':
      return { ...state, menuItems: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboardData: action.payload };
    case 'ADD_BEHAVIOR':
      return { ...state, userBehavior: [...state.userBehavior, action.payload] };
    case 'SET_ADAPTATIONS':
      return { ...state, adaptations: action.payload };
    default:
      return state;
  }
};

const AIContext = createContext<{
  state: AIState;
  sendMessage: (message: string, imageData?: string) => Promise<void>;
  cancelCurrent: () => void;
  updateContext: (context: Partial<AIContextType>) => void;
  generateMenu: () => Promise<void>;
  generateDashboard: () => Promise<void>;
  trackBehavior: (behavior: { type: string; [key: string]: string | number }) => void;
  analyzeAndAdapt: () => Promise<void>;
} | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = async (message: string, imageData?: string) => {
    // Abort any previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    dispatch({ type: 'SET_PROCESSING', payload: true });
    // Append to lightweight session memory (bounded) and use it for this request
    const trimmedMessage = message.trim();
    let effectiveContext = state.context;
    if (trimmedMessage) {
      const history = [...state.context.userHistory, `User: ${trimmedMessage}`];
      const bounded = history.slice(-8); // keep last 8 exchanges lines
      effectiveContext = { ...state.context, userHistory: bounded };
      dispatch({ type: 'UPDATE_CONTEXT', payload: { userHistory: bounded } });
    }
    try {
      const response = await aiService.generateResponse(message, effectiveContext, imageData, abortRef.current.signal);
      dispatch({ type: 'ADD_RESPONSE', payload: response });
      // Also add AI turn to memory
      if (response?.text) {
        const history = [...state.context.userHistory, `AI: ${response.text}`];
        const bounded = history.slice(-8);
        dispatch({ type: 'UPDATE_CONTEXT', payload: { userHistory: bounded } });
      }
      
      // Process AI actions - DISABLED to prevent automatic redirects
      // Actions should be handled manually by components
      if (response.actions) {
        console.log('AI actions available:', response.actions);
        // Actions are now handled by individual components (like chat)
        // instead of being automatically processed here
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
      abortRef.current = null;
    }
  };

  const cancelCurrent = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    dispatch({ type: 'SET_PROCESSING', payload: false });
  };

  const updateContext = useCallback((newContext: Partial<AIContextType>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: newContext });
  }, []);

  const generateMenu = useCallback(async () => {
    try {
      const menu = await aiService.generateNavigationMenu();
      dispatch({ type: 'SET_MENU', payload: menu });
    } catch (error) {
      console.error('Error generating menu:', error);
    }
  }, []);

  const generateDashboard = useCallback(async () => {
    try {
      const dashboard = await aiService.generateDashboardContent();
      dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
    } catch (error) {
      console.error('Error generating dashboard:', error);
    }
  }, []);

  const trackBehavior = useCallback((behavior: Record<string, string | number>) => {
    dispatch({ type: 'ADD_BEHAVIOR', payload: { ...behavior, timestamp: Date.now() } });
  }, []);

  const analyzeAndAdapt = useCallback(async () => {
    try {
      const analysis = await aiService.analyzeUserBehavior(state.userBehavior);
      dispatch({ type: 'SET_ADAPTATIONS', payload: analysis.adaptations });
    } catch (error) {
      console.error('Error analyzing behavior:', error);
    }
  }, [state.userBehavior]);

  // useEffect(() => {
  //   // Initialize AI on mount - disabled to prevent infinite loops
  //   generateMenu();
  //   generateDashboard();
  // }, [generateMenu, generateDashboard]);

  return (
    <AIContext.Provider value={{
      state,
      sendMessage,
      cancelCurrent,
      updateContext,
      generateMenu,
      generateDashboard,
      trackBehavior,
      analyzeAndAdapt
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};