import React from 'react';
import { ResearchStep } from '../../types/chat';

interface ResearchSidebarProps {
  isResearchMode: boolean;
  researchStep: ResearchStep;
  onExitResearchMode: () => void;
}

export const ResearchSidebar: React.FC<ResearchSidebarProps> = ({
  isResearchMode,
  researchStep,
  onExitResearchMode
}) => {
  if (!isResearchMode) return null;

  return (
    <div className="w-80 bg-gradient-to-b from-purple-50 to-blue-50 border-r border-purple-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-purple-200 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">🔬</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Research Assistant</h2>
            <p className="text-sm text-purple-600">Step {getStepNumber(researchStep)} - {getStepTitle(researchStep)}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex-1 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Research Progress</h3>
        <div className="space-y-4">
          <StepItem 
            stepNumber={1}
            title="Research Title"
            description="Define research focus"
            isActive={researchStep === 'title' || researchStep === 'title-input'}
            isCompleted={getStepNumber(researchStep) > 1}
          />
          
          <StepItem 
            stepNumber={2}
            title="Journal Search"
            description="Find Scopus/SINTA papers"
            isActive={researchStep === 'journals'}
            isCompleted={getStepNumber(researchStep) > 2}
          />
          
          <StepItem 
            stepNumber={3}
            title="Journal Analysis"
            description="Deep content analysis"
            isActive={researchStep === 'analysis'}
            isCompleted={getStepNumber(researchStep) > 3}
          />
          
          <StepItem 
            stepNumber={4}
            title="Reference Selection"
            description="Choose key references"
            isActive={researchStep === 'references'}
            isCompleted={getStepNumber(researchStep) > 4}
          />
          
          <StepItem 
            stepNumber={5}
            title="Chapter Writing"
            description="Generate content"
            isActive={researchStep === 'writing'}
            isCompleted={getStepNumber(researchStep) > 5}
          />
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-purple-200 flex-shrink-0 mt-8">
          <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button 
              onClick={onExitResearchMode}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Exit Research Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepItemProps {
  stepNumber: number;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
}

const StepItem: React.FC<StepItemProps> = ({
  stepNumber,
  title,
  description,
  isActive,
  isCompleted
}) => {
  return (
    <div className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
      isActive ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105' : 
      isCompleted ? 'border-green-300 bg-green-50' :
      'border-gray-200 bg-white'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
        isActive ? 'bg-purple-500 text-white animate-pulse' : 
        isCompleted ? 'bg-green-500 text-white' :
        'bg-gray-300 text-gray-600'
      }`}>
        {isCompleted ? '✓' : stepNumber}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const getStepNumber = (step: ResearchStep): number => {
  const stepMap = {
    initial: 0,
    title: 1,
    'title-input': 1,
    journals: 2,
    analysis: 3,
    references: 4,
    writing: 5
  };
  return stepMap[step];
};

const getStepTitle = (step: ResearchStep): string => {
  const titleMap = {
    initial: 'Getting Started',
    title: 'Research Title',
    'title-input': 'Research Title',
    journals: 'Journal Search',
    analysis: 'Journal Analysis',
    references: 'Reference Selection',
    writing: 'Chapter Writing'
  };
  return titleMap[step];
};