import React from 'react';

export const ResearchTypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3 max-w-3xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full accent-gradient flex items-center justify-center">
          <div className="w-4 h-4 text-white">🔬</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 shadow-sm rounded-2xl px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="text-purple-600 text-sm font-medium">Research Assistant sedang menganalisis...</div>
          </div>
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};