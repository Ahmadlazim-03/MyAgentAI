import React from 'react';
import Image from 'next/image';
import { Copy, Brain, User, Sparkles, BookOpen } from 'lucide-react';
import { Message, ResearchTitleSuggestion } from '../../types/chat';
import { formatMessage, getFaviconUrl } from '../../utils/markdown';
import { ResearchTitleCard } from '../research/ResearchTitleCard';

interface MessageBubbleProps {
  message: Message;
  onTitleSelection: (suggestion: ResearchTitleSuggestion) => void;
  onSuggestionClick: (suggestion: string) => void;
  selectedTitleId: string | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onTitleSelection,
  onSuggestionClick,
  selectedTitleId
}) => {
  return (
    <div className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex items-start space-x-3 w-full ${message.isAI ? '' : 'flex-row-reverse space-x-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.isAI 
            ? 'accent-gradient' 
            : 'bg-gradient-to-r from-gray-500 to-gray-600'
        }`}>
          {message.isAI ? (
            <Brain className="h-4 w-4 text-white" />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Message Column */}
        <div className={`${message.isAI ? 'max-w-4xl w-full' : 'max-w-2xl'}`}>
          {/* Message Bubble */}
          <div className={`relative group inline-block rounded-2xl p-4 ${
            message.isAI 
              ? 'w-full bg-[rgba(255,255,255,0.7)] backdrop-blur border border-gray-200 shadow-sm'
              : 'accent-gradient text-white max-w-fit'
          }`}>
            {/* Copy Button */}
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md ${
                message.isAI 
                  ? 'hover:bg-gray-100 text-gray-500' 
                  : 'hover:bg-white/20 text-white/70'
              }`}
              title="Copy message"
            >
              <Copy className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="pr-8">
              {message.isAI ? (
                <div className="prose prose-sm max-w-none">
                  {formatMessage(message.content)}
                </div>
              ) : (
                <div className="text-white whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              )}
              
              {/* Research Title Suggestions Display */}
              {message.researchData?.type === 'title_suggestions' && (
                <div className="mt-6">
                  <div className="grid gap-4">
                    {(message.researchData.data as ResearchTitleSuggestion[]).map((suggestion) => (
                      <ResearchTitleCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onSelect={onTitleSelection}
                        isSelected={selectedTitleId === suggestion.id}
                      />
                    ))}
                  </div>
                  
                  {selectedTitleId && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 font-medium">
                        ✅ Judul penelitian telah dipilih! Klik &quot;Lanjutkan ke pencarian jurnal&quot; untuk melanjutkan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Aksi cepat:
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-xs rounded-full transition-colors accent-chip hover:opacity-90"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Links Display */}
            {message.links && message.links.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Link terkait:
                </p>
                <div className="space-y-2">
                  {message.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Image
                        src={getFaviconUrl(link.href)}
                        alt="Site favicon"
                        width={16}
                        height={16}
                        className="mr-2 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = '/favicon.ico';
                        }}
                      />
                      <span className="text-sm text-blue-600 hover:text-blue-800 font-medium truncate">
                        {link.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`mt-2 text-xs text-gray-400 ${message.isAI ? 'text-left' : 'text-right'}`}>
            <p>
              {message.timestamp.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};