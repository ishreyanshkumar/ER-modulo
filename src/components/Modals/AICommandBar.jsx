import React, { useState, useEffect, useRef } from 'react';
import { Wand2, X, Sparkles, Loader2, Key, Info } from 'lucide-react';

export default function AICommandBar({ 
  isOpen, onClose, onSubmit, apiKey, setApiKey, darkMode = false 
}) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(prompt);
      setPrompt('');
      onClose();
    } catch (error) {
      console.error('AI Generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]" 
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-2xl transform transition-all animate-in slide-in-from-top-4 duration-500`}>
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-sky-600 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        
        <div className={`${darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'} border rounded-2xl shadow-2xl overflow-hidden`}>
          
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className={`flex items-center gap-4 px-6 py-4 ${darkMode ? 'bg-neutral-800/50' : 'bg-neutral-50/50'}`}>
              <Wand2 className="text-purple-500 animate-pulse" size={24} />
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your diagram... (e.g. 'A library management system')"
                className={`flex-1 bg-transparent border-none outline-none text-lg font-medium ${darkMode ? 'text-neutral-100' : 'text-neutral-800'}`}
                disabled={isLoading}
              />
              {isLoading ? (
                <Loader2 className="animate-spin text-purple-500" size={24} />
              ) : (
                <button 
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-sky-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                  Generate
                </button>
              )}
            </div>

            {/* API Key Section */}
            {showKeyInput && (
              <div className={`px-6 py-4 border-t ${darkMode ? 'border-neutral-800 bg-neutral-950/50' : 'border-neutral-100 bg-purple-50/30'}`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-neutral-500' : 'text-neutral-400'} flex items-center gap-1.5`}>
                      <Key size={12} /> OpenAI API Key Required
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowKeyInput(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className={`flex-1 ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-purple-500/20' : 'bg-white border-neutral-200 focus:ring-purple-500/10'} border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-4 focus:border-purple-500 transition-all`}
                    />
                  </div>
                  <p className={`text-[10px] ${darkMode ? 'text-neutral-500' : 'text-neutral-400'} flex items-center gap-1`}>
                    <Info size={10} /> Key is stored locally and never sent to our servers.
                  </p>
                </div>
              </div>
            )}
            
            <div className={`px-6 py-3 border-t ${darkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-100 text-neutral-400'} text-[10px] font-bold flex justify-between items-center`}>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="px-1 border rounded">Enter</span> to generate</span>
                <span className="flex items-center gap-1"><span className="px-1 border rounded">Esc</span> to close</span>
              </div>
              <div className="flex items-center gap-1 text-purple-500">
                <Sparkles size={12} /> AI Architect Mode
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
