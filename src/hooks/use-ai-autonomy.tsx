'use client';

import React, { useEffect, useState } from 'react';
import { useAI } from '@/contexts/ai-context';
import { aiService } from '@/lib/ai-service';

interface AutoDecision {
  id: string;
  type: 'ui_change' | 'navigation' | 'content' | 'feature';
  decision: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  applied: boolean;
}

interface FallbackDecision {
  type: string;
  decision: string;
  reasoning: string;
  impact: string;
}

export const useAIAutonomy = () => {
  const { state, trackBehavior, updateContext } = useAI();
  const [decisions, setDecisions] = useState<AutoDecision[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateFallbackDecisions = React.useCallback((behaviors: Record<string, string | number>[]): FallbackDecision[] => {
    const decisions = [];
    
    // Analyze navigation patterns
    const navigationEvents = behaviors.filter(b => b.type === 'navigation');
    if (navigationEvents.length > 5) {
      decisions.push({
        type: 'navigation',
        decision: 'Add quick navigation shortcuts for frequently visited pages',
        reasoning: 'User navigates frequently between pages',
        impact: 'low'
      });
    }

    // Analyze chat usage
    const chatEvents = behaviors.filter(b => typeof b.type === 'string' && b.type.includes('chat'));
    if (chatEvents.length > 3) {
      decisions.push({
        type: 'ui_change',
        decision: 'Show AI chat widget on all pages',
        reasoning: 'User actively uses AI chat features',
        impact: 'medium'
      });
    }

    // Analyze content creation
    const contentEvents = behaviors.filter(b => typeof b.type === 'string' && b.type.includes('content'));
    if (contentEvents.length > 2) {
      decisions.push({
        type: 'feature',
        decision: 'Add content templates and suggestions',
        reasoning: 'User frequently creates content',
        impact: 'medium'
      });
    }

    return decisions.slice(0, 3);
  }, []);

  const applyDecision = React.useCallback((decision: AutoDecision) => {
    console.log('Applying AI decision:', decision);
    
    switch (decision.type) {
      case 'ui_change':
        if (decision.decision.includes('theme')) {
          document.body.classList.add('ai-adapted-theme');
        }
        break;
      case 'navigation':
        updateContext({
          preferences: { ...state.context.preferences, quickNav: true }
        });
        break;
      case 'content':
        updateContext({
          preferences: { ...state.context.preferences, contentSuggestions: true }
        });
        break;
      case 'feature':
        updateContext({
          preferences: { ...state.context.preferences, enhancedFeatures: true }
        });
        break;
    }

    setDecisions(prev => 
      prev.map(d => d.id === decision.id ? { ...d, applied: true } : d)
    );

    trackBehavior({
      type: 'ai_decision_applied',
      decisionType: decision.type,
      decisionId: decision.id,
      timestamp: Date.now()
    });
  }, [updateContext, state.context.preferences, trackBehavior]);

  const makeAutonomousDecisions = React.useCallback(async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      const behaviorsForAnalysis = state.userBehavior.slice(-20);
      
      const analysisPrompt = `
      Analyze user behavior and make autonomous decisions to improve UX.
      Behavior: ${JSON.stringify(behaviorsForAnalysis)}
      
      Return JSON with decisions array containing type, decision, reasoning, impact fields.
      `;

      const response = await aiService.generateResponse(analysisPrompt, state.context);
      
      let aiDecisions: FallbackDecision[] = [];
      try {
        const parsed = JSON.parse(response.text);
        aiDecisions = parsed.decisions || [];
      } catch {
        aiDecisions = generateFallbackDecisions(behaviorsForAnalysis);
      }

      const newDecisions: AutoDecision[] = aiDecisions.map((decision, index) => ({
        id: `${Date.now()}_${index}`,
        type: (decision.type as AutoDecision['type']) || 'ui_change',
        decision: decision.decision || 'Improve user interface',
        reasoning: decision.reasoning || 'Based on user patterns',
        impact: (decision.impact as AutoDecision['impact']) || 'medium',
        timestamp: new Date(),
        applied: false
      }));

      setDecisions(prev => [...prev, ...newDecisions]);

      // Auto-apply low impact decisions
      newDecisions.forEach(decision => {
        if (decision.impact === 'low') {
          applyDecision(decision);
        }
      });

      // Don't track behavior here to avoid infinite loops
      console.log(`AI made ${newDecisions.length} autonomous decisions`);

    } catch (error) {
      console.error('Error making decisions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, state.userBehavior, state.context, generateFallbackDecisions, applyDecision]);

  useEffect(() => {
    // Only trigger autonomous decisions every 10 behaviors, but skip if analyzing or decisions were just made
    if (state.userBehavior.length > 0 && 
        state.userBehavior.length % 10 === 0 && 
        !isAnalyzing &&
        !state.userBehavior.some(b => b.type === 'ai_autonomous_decision' && Date.now() - (b.timestamp as number) < 30000)
       ) {
      makeAutonomousDecisions();
    }
  }, [state.userBehavior, makeAutonomousDecisions, isAnalyzing]);

  return {
    decisions,
    isAnalyzing,
    applyDecision,
    makeAutonomousDecisions
  };
};

export const AIDecisionMonitor: React.FC = () => {
  const { decisions, isAnalyzing, applyDecision } = useAIAutonomy();
  const [showMonitor, setShowMonitor] = useState(false);

  if (!showMonitor) {
    return (
      <button
        onClick={() => setShowMonitor(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        title="AI Decision Monitor"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">AI Decision Monitor</h3>
          <button
            onClick={() => setShowMonitor(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {isAnalyzing && (
          <p className="text-sm text-blue-600 mt-1">AI is analyzing behavior...</p>
        )}
      </div>
      
      <div className="max-h-64 overflow-y-auto p-4">
        {decisions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            AI will make autonomous decisions based on your usage
          </p>
        ) : (
          <div className="space-y-3">
            {decisions.slice(-5).map((decision) => (
              <div key={decision.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    decision.impact === 'high' ? 'bg-red-100 text-red-700' :
                    decision.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {decision.impact} impact
                  </span>
                  {decision.applied && (
                    <span className="text-xs text-green-600">✓ Applied</span>
                  )}
                </div>
                <h4 className="font-medium text-sm text-gray-900">{decision.decision}</h4>
                <p className="text-xs text-gray-600 mt-1">{decision.reasoning}</p>
                {!decision.applied && decision.impact !== 'low' && (
                  <button
                    onClick={() => applyDecision(decision)}
                    className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Apply Decision
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};