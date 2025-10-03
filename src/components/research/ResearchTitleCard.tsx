import React from 'react';
import { Clock, User, BookOpen, Target } from 'lucide-react';
import { ResearchTitleSuggestion } from '../../types/chat';
import { 
  getComprehensiveDescription, 
  getResearchScope, 
  getMethodologyApproach, 
  getExpectedOutcomes 
} from '../../utils/research';

interface ResearchTitleCardProps {
  suggestion: ResearchTitleSuggestion; 
  onSelect: (suggestion: ResearchTitleSuggestion) => void;
  isSelected: boolean;
}

export const ResearchTitleCard: React.FC<ResearchTitleCardProps> = ({
  suggestion,
  onSelect,
  isSelected
}) => {
  return (
    <div
      className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
        isSelected 
          ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
      }`}
      onClick={() => onSelect(suggestion)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
            {suggestion.title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              suggestion.complexity === 'advanced' ? 'bg-red-100 text-red-700' :
              suggestion.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {suggestion.complexity === 'advanced' ? 'Lanjutan' :
               suggestion.complexity === 'intermediate' ? 'Menengah' : 'Pemula'}
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {suggestion.estimatedDuration}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Description */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Deskripsi Penelitian
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getComprehensiveDescription(suggestion)}
          </p>
        </div>

        {/* Research Scope */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Ruang Lingkup
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getResearchScope(suggestion)}
          </p>
        </div>

        {/* Methodology */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Metodologi
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getMethodologyApproach(suggestion)}
          </p>
        </div>

        {/* Expected Outcomes */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Hasil yang Diharapkan
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getExpectedOutcomes(suggestion)}
          </p>
        </div>

        {/* Keywords */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Kata Kunci</h4>
          <div className="flex flex-wrap gap-2">
            {suggestion.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Field */}
        <div className="pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Bidang: </span>
          <span className="text-sm font-medium text-gray-700">{suggestion.field}</span>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isSelected
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(suggestion);
          }}
        >
          {isSelected ? 'Terpilih ✓' : 'Pilih Judul Ini'}
        </button>
      </div>
    </div>
  );
};