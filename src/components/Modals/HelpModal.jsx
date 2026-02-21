import React from 'react';
import { 
  X, HelpCircle, MousePointer2, Move, ZoomIn, 
  Wand2, Play, Layout, Save, Terminal, Sparkles, Command
} from 'lucide-react';

export default function HelpModal({ isOpen, onClose, darkMode = false }) {
  if (!isOpen) return null;

  const Shortcut = ({ keys, label }) => (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{label}</span>
      <div className="flex gap-1">
        {keys.map(key => (
          <kbd key={key} className={`px-2 py-1 rounded text-[10px] font-bold border ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-600'} shadow-sm`}>
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );

  const Feature = ({ icon: Icon, title, desc, color }) => (
    <div className="flex gap-4 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg shrink-0 h-fit`}>
        <Icon size={20} />
      </div>
      <div>
        <h4 className={`text-sm font-bold mb-1 ${darkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>{title}</h4>
        <p className={`text-xs leading-relaxed ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col border ${darkMode ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-800'} rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500 rounded-xl text-white shadow-lg shadow-sky-500/20">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">User Guide</h2>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>ER Diagrammer v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-800 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Core Features */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-4">Core Capabilities</h3>
              <div className="space-y-3">
                <Feature 
                  icon={Wand2} 
                  title="AI Architect" 
                  desc="Describe your database in natural language using Cmd+K. The AI generates entities, relationships, and attributes automatically."
                  color="bg-purple-500"
                />
                <Feature 
                  icon={Play} 
                  title="SQL Simulation" 
                  desc="Test your schema in a real SQLite sandbox. Run ad-hoc queries and verify table integrity before exporting."
                  color="bg-emerald-500"
                />
                <Feature 
                  icon={Layout} 
                  title="Magic Layout" 
                  desc="Automatically organize complex diagrams. Uses intelligent graph algorithms to minimize edge crossings and optimize space."
                  color="bg-sky-500"
                />
                <Feature 
                  icon={Terminal} 
                  title="Cross-Dialect Export" 
                  desc="Export to PostgreSQL, MySQL, Oracle, or SQLite. Generates clean, DDL-compliant SQL scripts for your database."
                  color="bg-neutral-700"
                />
              </div>
            </div>

            {/* Interaction & Shortcuts */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-500 mb-4">Canvas Navigation</h3>
                <div className="grid grid-cols-1 gap-1">
                  <Shortcut label="Zoom In / Out" keys={['Scroll Wheel']} />
                  <Shortcut label="Pan Canvas" keys={['Space', 'Drag']} />
                  <Shortcut label="Select Element" keys={['Click']} />
                  <Shortcut label="Multi-select" keys={['Shift', 'Click']} />
                  <Shortcut label="Delete Selection" keys={['Delete / Backspace']} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-500 mb-4">Pro Shortcuts</h3>
                <div className="grid grid-cols-1 gap-1">
                  <Shortcut label="Open AI Architect" keys={['Ctrl/Cmd', 'K']} />
                  <Shortcut label="Undo Action" keys={['Ctrl/Cmd', 'Z']} />
                  <Shortcut label="Redo Action" keys={['Ctrl/Cmd', 'Y']} />
                  <Shortcut label="Duplicate Node" keys={['Ctrl/Cmd', 'D']} />
                  <Shortcut label="Toggle Dark Mode" keys={['Ctrl/Cmd', 'M']} />
                </div>
              </div>

              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-100'} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-sky-500" size={16} />
                  <span className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-sky-400' : 'text-sky-700'}`}>Pro Tip</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-sky-900/70'}`}>
                  Sidebars auto-hide to maximize your workspace. Just hover the left or right screen edges to reveal the tools and settings.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className={`px-8 py-4 ${darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-50 text-neutral-400'} border-t ${darkMode ? 'border-neutral-800' : 'border-neutral-100'} flex justify-between items-center text-[10px] font-bold uppercase tracking-widest`}>
          <span>Inspired by Classic DB Modeling tools</span>
          <div className="flex gap-4">
            <span className="hover:text-sky-500 cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-sky-500 cursor-pointer transition-colors">Changelog</span>
          </div>
        </div>
      </div>
    </div>
  );
}
