import React, { useRef } from 'react';
import Image from 'next/image';
import { Send, ImageIcon, Mic, MicOff, Volume2, VolumeX, Loader } from 'lucide-react';

interface InputAreaProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  attachedImages: string[];
  setAttachedImages: React.Dispatch<React.SetStateAction<string[]>>;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isProcessing: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onVoiceInput: () => void;
  onTextToSpeech: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  setInputValue,
  attachedImages,
  setAttachedImages,
  onSendMessage,
  onKeyPress,
  isProcessing,
  isListening,
  isSpeaking,
  onVoiceInput,
  onTextToSpeech
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setAttachedImages(prev => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  return (
    <div className="sticky bottom-0 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200">
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6">
        <div className="rounded-2xl border panel-surface shadow p-3">
          <div className="flex items-start space-x-3 w-full">
            <div className="flex-1">
              {attachedImages.length > 0 && (
                <div className="mb-2 border border-gray-200 bg-white rounded-xl p-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600">Lampiran ({attachedImages.length})</p>
                    <button
                      onClick={() => setAttachedImages([])}
                      className="text-xs px-2 py-1 rounded border text-gray-600 hover:bg-gray-50"
                      title="Hapus semua gambar"
                    >
                      Hapus semua
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 flex-shrink-0">
                        <Image 
                          src={img} 
                          alt={`preview ${idx+1}`} 
                          fill 
                          unoptimized 
                          className="object-cover rounded-lg border shadow-sm" 
                        />
                        <button
                          onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                          title="Hapus gambar"
                          className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 text-xs leading-6 text-gray-700 shadow hover:bg-gray-50"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Ketik pesan Anda di sini... Coba: 'Mulai penelitian', 'Buatkan kode HTML'"
                className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent text-gray-700 placeholder-gray-400 ring-1 ring-gray-200"
                rows={1}
                style={{ 
                  minHeight: '48px', 
                  maxHeight: '120px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              {/* Upload Image Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors h-12 w-12 flex items-center justify-center"
                title="Upload Image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              
              {/* Mic Button */}
              <button
                onClick={onVoiceInput}
                className={`p-3 rounded-xl transition-colors h-12 w-12 flex items-center justify-center ${
                  isListening 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title={isListening ? "Stop Recording" : "Voice Input"}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              
              {/* Speaker Button */}
              <button
                onClick={onTextToSpeech}
                className={`p-3 rounded-xl transition-colors h-12 w-12 flex items-center justify-center ${
                  isSpeaking 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title={isSpeaking ? "Stop Speaking" : "Text to Speech"}
              >
                {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              
              {/* Send Button */}
              <button
                onClick={onSendMessage}
                disabled={(!inputValue.trim() && attachedImages.length === 0) || isProcessing}
                className="flex-shrink-0 text-white h-12 w-12 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg accent-gradient hover:opacity-90 flex items-center justify-center ml-2"
              >
                {isProcessing ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
};