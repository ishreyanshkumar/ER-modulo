import React from 'react';
import { MousePointer2, Square, Diamond, Triangle, Circle, StickyNote } from 'lucide-react';

export function ToolButton({ icon, active, onClick, tooltip, darkMode }) {
  return (
    <button 
      onClick={onClick} 
      title={tooltip} 
      className={`relative p-3 rounded-2xl transition-all duration-300 group shrink-0 ${
        active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 scale-110' : 
        darkMode ? 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
      }`}
    >
      {React.cloneElement(icon, { size: 20 })}
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 ${darkMode ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-900 text-white'} text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-2xl transition-all translate-y-2 group-hover:translate-y-0`}>
        {tooltip}
      </div>
    </button>
  );
}

export default function BottomToolbar({ mode, setMode, darkMode }) {
  return (
    <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-500
      ${darkMode ? 'bg-neutral-900/95 border-neutral-800' : 'bg-white/95 border-neutral-200'} 
      backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-3 py-2 flex items-center gap-2 border`}
    >
      <ToolButton icon={<MousePointer2 />} active={mode === 'select'} onClick={() => setMode('select')} tooltip="Select Mode (V)" darkMode={darkMode} />
      <div className={`w-px h-8 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'} shrink-0`} />
      <ToolButton icon={<Square />} active={mode === 'add-rect'} onClick={() => setMode('add-rect')} tooltip="Entity Table" darkMode={darkMode} />
      <ToolButton icon={<Diamond />} active={mode === 'add-dia'} onClick={() => setMode('add-dia')} tooltip="Relationship" darkMode={darkMode} />
      <ToolButton icon={<Triangle />} active={mode === 'add-isa'} onClick={() => setMode('add-isa')} tooltip="ISA Inheritance" darkMode={darkMode} />
      <ToolButton icon={<Circle />} active={mode === 'add-attr'} onClick={() => setMode('add-attr')} tooltip="Loose Attribute" darkMode={darkMode} />
      <div className={`w-px h-8 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'} shrink-0`} />
      <ToolButton icon={<StickyNote />} active={mode === 'add-note'} onClick={() => setMode('add-note')} tooltip="Sticky Note" darkMode={darkMode} />
    </div>
  );
}
