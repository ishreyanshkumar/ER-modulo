import React from 'react';
import { 
  MousePointer2, Square, Diamond, Plus, Undo, Redo, Grid, ZoomIn, ZoomOut, Save, Upload, FileCode2, Triangle, Circle,
  Moon, Sun, ImageIcon, FileDown, Sparkles, Wand2, StickyNote, Play, HelpCircle
} from 'lucide-react';

export function ToolButton({ icon, active, onClick, tooltip, disabled = false, darkMode }) {
  return (
    <button 
      disabled={disabled} 
      onClick={onClick} 
      title={tooltip} 
      className={`relative p-3.5 rounded-2xl transition-all duration-300 group shrink-0 ${
        disabled ? 'opacity-20 cursor-not-allowed' : 
        active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 scale-110' : 
        darkMode ? 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
      }`}
    >
      {React.cloneElement(icon, { size: 20 })}
      {!disabled && (
        <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 ${darkMode ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-900 text-white'} text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-2xl transition-all translate-x-2 group-hover:translate-x-0`}>
          {tooltip}
        </div>
      )}
    </button>
  );
}

export default function Toolbar({ 
  mode, setMode, undo, redo, pastCount, futureCount, 
  snapToGrid, setSnapToGrid, setZoom, handleSave, handleLoad, setSqlModalOpen, setImportModalOpen,
  simulationOpen, setSimulationOpen,
  aiCommandOpen, setAiCommandOpen,
  helpModalOpen, setHelpModalOpen,
  darkMode, setDarkMode, handleExport, autoLayoutNodes
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  const Separator = () => (
    <div className={`w-8 h-px ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} shrink-0 my-1`} />
  );

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 bottom-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] 
        ${isHovered ? 'w-20' : 'w-4'} 
        ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'} 
        border-r shadow-[0_0_50px_rgba(0,0,0,0.1)] group/toolbar`}
    >
      {/* Auto-hide Handle Indicator */}
      {!isHovered && (
        <div className={`absolute inset-y-0 right-0 w-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} group-hover/toolbar:bg-sky-500 transition-colors animate-pulse`} />
      )}

      <div className={`flex flex-col items-center h-full w-20 py-6 gap-3 transition-all duration-300 overflow-y-auto custom-scrollbar ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <ToolButton icon={<MousePointer2 />} active={mode === 'select'} onClick={() => setMode('select')} tooltip="Select Mode" darkMode={darkMode} />
        <Separator />
        <ToolButton icon={<Square />} active={mode === 'add-rect'} onClick={() => setMode('add-rect')} tooltip="Entity Table" darkMode={darkMode} />
        <ToolButton icon={<Diamond />} active={mode === 'add-dia'} onClick={() => setMode('add-dia')} tooltip="Relationship" darkMode={darkMode} />
        <ToolButton icon={<Triangle />} active={mode === 'add-isa'} onClick={() => setMode('add-isa')} tooltip="ISA Inheritance" darkMode={darkMode} />
        <ToolButton icon={<Circle />} active={mode === 'add-attr'} onClick={() => setMode('add-attr')} tooltip="Loose Attribute" darkMode={darkMode} />
        <ToolButton icon={<StickyNote />} active={mode === 'add-note'} onClick={() => setMode('add-note')} tooltip="Sticky Note" darkMode={darkMode} />
        <Separator />
        <ToolButton icon={<Undo />} onClick={undo} disabled={pastCount === 0} tooltip="Undo" darkMode={darkMode} />
        <ToolButton icon={<Redo />} onClick={redo} disabled={futureCount === 0} tooltip="Redo" darkMode={darkMode} />
        <Separator />
        <ToolButton icon={darkMode ? <Sun /> : <Moon />} onClick={() => setDarkMode(!darkMode)} tooltip={darkMode ? "Light Mode" : "Dark Mode"} darkMode={darkMode} />
        <ToolButton icon={<Grid />} active={snapToGrid} onClick={() => setSnapToGrid(!snapToGrid)} tooltip="Grid Snapping" darkMode={darkMode} />
        <ToolButton icon={<ZoomIn />} onClick={() => setZoom(z => Math.min(z + 0.1, 2))} tooltip="Zoom In" darkMode={darkMode} />
        <ToolButton icon={<ZoomOut />} onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} tooltip="Zoom Out" darkMode={darkMode} />
        <Separator />
        <ToolButton icon={<Wand2 className="text-sky-500" />} onClick={autoLayoutNodes} tooltip="Magic Layout" darkMode={darkMode} />
        <ToolButton icon={<Save />} onClick={handleSave} tooltip="Save Workspace" darkMode={darkMode} />
        <ToolButton icon={<Sparkles className="text-amber-500" />} onClick={() => setImportModalOpen(true)} tooltip="AI Assisted" darkMode={darkMode} />
        <label className={`relative p-3.5 rounded-2xl transition-all duration-300 cursor-pointer group shrink-0 ${darkMode ? 'text-neutral-500 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-100'}`} title="Load Workspace">
          <Upload size={20} />
          <input type="file" accept=".json" onChange={handleLoad} className="hidden" />
          <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 ${darkMode ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-900 text-white'} text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-2xl transition-all translate-x-2 group-hover:translate-x-0`}>Load</div>
        </label>
        <Separator />
        <ToolButton icon={<ImageIcon />} onClick={() => handleExport('png')} tooltip="Export PNG" darkMode={darkMode} />
        <ToolButton icon={<FileDown />} onClick={() => handleExport('svg')} tooltip="Export SVG" darkMode={darkMode} />
        <ToolButton icon={<Play className="text-emerald-500" />} active={simulationOpen} onClick={() => setSimulationOpen(!simulationOpen)} tooltip="Run Simulation" darkMode={darkMode} />
        <ToolButton icon={<Wand2 className="text-purple-500" />} active={aiCommandOpen} onClick={() => setAiCommandOpen(!aiCommandOpen)} tooltip="AI Architect (Cmd+K)" darkMode={darkMode} />
        <ToolButton icon={<FileCode2 />} onClick={() => setSqlModalOpen(true)} tooltip="Compile SQL" darkMode={darkMode} />
        <Separator />
        <ToolButton icon={<HelpCircle />} active={helpModalOpen} onClick={() => setHelpModalOpen(true)} tooltip="User Guide" darkMode={darkMode} />
      </div>
    </div>
  );
}
