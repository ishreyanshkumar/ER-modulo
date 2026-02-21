import React, { useState } from 'react';
import { 
  Settings, MousePointer2, BoxSelect, Copy, Trash2, Key, Link as LinkIcon, Plus, X, Palette, Triangle, Hash,
  Type, Layers, Undo, Redo, ZoomIn, ZoomOut, Save, Upload, FileCode2, Moon, Sun, ImageIcon, FileDown, Sparkles, Wand2, Play, HelpCircle,
  AlignHorizontalSpaceAround, ChevronLeft, ChevronRight
} from 'lucide-react';
import { DATA_TYPES } from '../../hooks/useDiagramState';

export function AttrToggle({ icon, label, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${active ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300' : 'bg-neutral-100/50 text-neutral-500 hover:bg-neutral-200'}`}>
      {icon} {label}
    </button>
  );
}

export default function TopRibbon({ 
  selectedItem, nodes, edges, 
  updateSelectedNode, updateEdgeProperties, deleteSelectedItem, 
  handleDuplicate, alignNeighbors, createAggregation, commitAction, clearCanvas,
  undo, redo, pastCount, futureCount, setZoom, handleSave, handleLoad, setSqlModalOpen, setImportModalOpen,
  simulationOpen, setSimulationOpen, aiCommandOpen, setAiCommandOpen,
  helpModalOpen, setHelpModalOpen, darkMode, setDarkMode, handleExport, autoLayoutNodes
}) {
  const activeNode = selectedItem?.type === 'node' ? nodes.find(n => n.id === selectedItem.id) : null;
  const activeEdge = selectedItem?.type === 'edge' ? edges.find(e => e.id === selectedItem.id) : null;
  
  const [showAttrMenu, setShowAttrMenu] = useState(false);

  const ToolButton = ({ icon, onClick, tooltip, disabled }) => (
    <button onClick={onClick} disabled={disabled} title={tooltip} className={`p-2 rounded-xl transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900')}`}>
      {React.cloneElement(icon, { size: 16 })}
    </button>
  );

  const Separator = () => (
    <div className={`w-px h-6 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200'} shrink-0`} />
  );

  return (
    <div className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 ${darkMode ? 'bg-neutral-900/80 border-neutral-800 text-neutral-200' : 'bg-white/80 border-neutral-200 text-neutral-800'} backdrop-blur-md border-b shadow-sm`}>
      
      {/* LEFT: Global Project Tools */}
      <div className="flex items-center gap-1">
        <div className="font-bold text-sm mr-4 flex items-center gap-2">
           <div className="p-1.5 bg-sky-500 rounded-lg shadow-sm">
             <Settings size={14} className="text-white" />
           </div>
           <span className="tracking-tight">ER-Modulo</span>
        </div>
        <Separator />
        
        <ToolButton icon={<Undo />} onClick={undo} disabled={pastCount === 0} tooltip="Undo" />
        <ToolButton icon={<Redo />} onClick={redo} disabled={futureCount === 0} tooltip="Redo" />
        <Separator />
        <ToolButton icon={<ZoomIn />} onClick={() => setZoom(z => Math.min(z + 0.1, 2))} tooltip="Zoom In" />
        <ToolButton icon={<ZoomOut />} onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} tooltip="Zoom Out" />
        <ToolButton icon={<Wand2 className="text-sky-500" />} onClick={autoLayoutNodes} tooltip="Magic Layout" />
        <Separator />
        <ToolButton icon={<Save />} onClick={handleSave} tooltip="Save Workspace" />
        <label className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'}`} title="Load Workspace">
          <Upload size={16} />
          <input type="file" accept=".json" onChange={handleLoad} className="hidden" />
        </label>
        <ToolButton icon={<Trash2 />} onClick={clearCanvas} tooltip="Clear Canvas" />
      </div>

      {/* CENTER: Contextual Properties (The "Sidebar" replacement) */}
      <div className="flex-1 flex justify-center items-center">
        {activeNode && (activeNode.shape === 'rectangle' || activeNode.shape === 'diamond') && (
          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-2xl ${darkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} border shadow-inner`}>
            {/* Name */}
            <input 
              type="text" value={activeNode.name} 
              onChange={(e) => updateSelectedNode({ name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} 
              onBlur={() => commitAction(nodes, edges)}
              className={`w-32 bg-transparent border-none text-sm font-bold focus:outline-none focus:ring-0 ${darkMode ? 'text-neutral-200 placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'}`}
              placeholder="Entity Name"
            />
            
            <Separator />
            
            {/* Weak/Identifying */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-widest text-neutral-500">
               <input type="checkbox" checked={activeNode.isWeak} onChange={(e) => updateSelectedNode({ isWeak: e.target.checked }, true)} className="accent-sky-500" />
               <span className={darkMode ? 'text-neutral-400' : 'text-neutral-500'}>{activeNode.shape === 'rectangle' ? 'Weak' : 'Identifying'}</span>
            </label>

            <Separator />
            
            {/* Colors */}
            <div className="flex gap-1 items-center">
               {['bg-[#bae6fd]', 'bg-[#fecaca]', 'bg-[#bbf7d0]', 'bg-[#fef08a]', 'bg-[#e9d5ff]'].map(color => (
                  <button key={color} onClick={() => updateSelectedNode({ color }, true)} className={`w-4 h-4 rounded-full ${color} ${activeNode.color === color ? 'ring-2 ring-sky-500 scale-110' : ''} transition-all`} />
               ))}
            </div>

            <Separator />
            
            {/* Actions */}
            <button onClick={handleDuplicate} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-600'}`} title="Duplicate"><Copy size={14}/></button>
            <button onClick={alignNeighbors} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-600'}`} title="Align Neighbors"><AlignHorizontalSpaceAround size={14}/></button>
            <button onClick={createAggregation} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-600'}`} title="Create Aggregation"><BoxSelect size={14}/></button>
            <button onClick={deleteSelectedItem} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 size={14}/></button>
            
            {/* Attributes Popover (Rectangle only) */}
            {activeNode.shape === 'rectangle' && (
              <div className="relative">
                <button 
                  onClick={() => setShowAttrMenu(!showAttrMenu)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showAttrMenu ? 'bg-sky-500 text-white' : (darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-white hover:bg-neutral-100 border text-neutral-700')}`}
                >
                  <Layers size={14} /> Cols ({activeNode.attributes?.length || 0})
                </button>
                
                {showAttrMenu && (
                  <div className={`absolute top-full mt-2 w-[460px] right-0 ${darkMode ? 'bg-neutral-900 border-neutral-700 shadow-neutral-900/50' : 'bg-white border-neutral-200'} border rounded-2xl shadow-2xl p-4 z-50`}>
                     <div className="flex justify-between items-center mb-3">
                       <span className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Attributes</span>
                       <button onClick={() => updateSelectedNode({ attributes: [...(activeNode.attributes || []), { id: `a_${Date.now()}`, name: 'new_col', type: 'VARCHAR(255)', isPK: false, isFK: false, isNullable: true, isPartialKey: false, indent: 0 }] }, true)} className="text-sky-500 hover:text-sky-600 font-bold text-xs">+ Add</button>
                     </div>
                     <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                       {activeNode.attributes?.map(attr => (
                         <div key={attr.id} className={`p-2 rounded-xl border ${darkMode ? 'border-neutral-800 bg-neutral-950/50' : 'border-neutral-100 bg-neutral-50'}`}>
                            <div className="flex items-center gap-2 mb-2" style={{ paddingLeft: `${(attr.indent || 0) * 12}px` }}>
                               <input value={attr.name} onChange={(e) => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? { ...a, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') } : a) })} onBlur={() => commitAction(nodes, edges)} className={`flex-1 bg-transparent border-none text-xs font-bold focus:outline-none ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`} />
                               <select value={attr.type} onChange={(e) => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? { ...a, type: e.target.value } : a) }, true)} className={`text-[10px] bg-transparent font-mono w-24 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                 {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                               <button onClick={() => updateSelectedNode({ attributes: (activeNode.attributes || []).filter(a => a.id !== attr.id) }, true)} className="text-red-500/50 hover:text-red-500"><X size={12}/></button>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 pl-1 mt-1">
                               <AttrToggle icon={<Key size={8}/>} label="PK" active={attr.isPK} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isPK: !a.isPK, isPartialKey: false } : a) }, true)} />
                               <AttrToggle icon={<Hash size={8}/>} label="Part" active={attr.isPartialKey} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isPartialKey: !a.isPartialKey, isPK: false } : a) }, true)} />
                               <AttrToggle icon={<LinkIcon size={8}/>} label="FK" active={attr.isFK} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isFK: !a.isFK } : a) }, true)} />
                               <AttrToggle icon={<span className="text-[8px]">{'{}'}</span>} label="Multi" active={attr.isMultivalued} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isMultivalued: !a.isMultivalued } : a) }, true)} />
                               <AttrToggle icon={<span className="text-[8px]">()</span>} label="Deriv" active={attr.isDerived} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isDerived: !a.isDerived } : a) }, true)} />
                               <AttrToggle icon={<span className="text-[8px]">Ø</span>} label="Null" active={attr.isNullable} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isNullable: !a.isNullable } : a) }, true)} />
                               
                               <div className="flex items-center gap-0.5 ml-auto bg-neutral-200/50 dark:bg-neutral-800/80 rounded p-0.5" title="Indent (Composite Parent)">
                                 <button onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, indent: Math.max(0, (a.indent || 0) - 1) } : a) }, true)} className="p-0.5 hover:bg-white dark:hover:bg-neutral-700 rounded text-neutral-500 shadow-sm"><ChevronLeft size={10}/></button>
                                 <span className="text-[10px] font-mono text-neutral-500 px-1">{attr.indent || 0}</span>
                                 <button onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, indent: (a.indent || 0) + 1 } : a) }, true)} className="p-0.5 hover:bg-white dark:hover:bg-neutral-700 rounded text-neutral-500 shadow-sm"><ChevronRight size={10}/></button>
                               </div>
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeNode && activeNode.shape === 'isa' && (
           <div className={`flex items-center gap-3 px-4 py-1.5 rounded-2xl ${darkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} border shadow-inner`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>ISA</span>
              <Separator />
              <select value={activeNode.constraint || 'disjoint'} onChange={(e) => updateSelectedNode({ constraint: e.target.value }, true)} className={`bg-transparent text-xs font-bold focus:outline-none ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                 <option value="disjoint">Disjoint (d)</option><option value="overlapping">Overlapping (o)</option>
              </select>
              <Separator />
              <select value={activeNode.completeness || 'partial'} onChange={(e) => updateSelectedNode({ completeness: e.target.value }, true)} className={`bg-transparent text-xs font-bold focus:outline-none ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                 <option value="partial">Partial</option><option value="total">Total</option>
              </select>
              <Separator />
              <button onClick={deleteSelectedItem} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 size={14}/></button>
           </div>
        )}

        {activeEdge && (
           <div className={`flex items-center gap-3 px-4 py-1.5 rounded-2xl ${darkMode ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} border shadow-inner`}>
              <LinkIcon size={14} className="text-neutral-400" />
              <input 
                type="text" value={activeEdge.label || ''} 
                onChange={(e) => updateEdgeProperties(activeEdge.id, { label: e.target.value })} 
                onBlur={() => commitAction(nodes, edges)}
                placeholder="Label / Role"
                className={`w-32 bg-transparent border-none text-sm font-bold focus:outline-none focus:ring-0 ${darkMode ? 'text-neutral-200 placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'}`}
              />
              <Separator />
              <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                 <input type="checkbox" checked={activeEdge.dashed} onChange={(e) => updateEdgeProperties(activeEdge.id, { dashed: e.target.checked }, true)} className="accent-sky-500" />
                 Dashed Line
              </label>
              <Separator />
              <button onClick={deleteSelectedItem} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 size={14}/></button>
           </div>
        )}
      </div>

      {/* RIGHT: Export & Advanced */}
      <div className="flex items-center gap-1">
        <ToolButton icon={<ImageIcon />} onClick={() => handleExport('png')} tooltip="Export PNG" />
        <ToolButton icon={<FileDown />} onClick={() => handleExport('svg')} tooltip="Export SVG" />
        <ToolButton icon={<FileCode2 />} onClick={() => setSqlModalOpen(true)} tooltip="Compile SQL" />
        <Separator />
        <ToolButton icon={<Sparkles className="text-amber-500" />} onClick={() => setImportModalOpen(true)} tooltip="AI Assisted" />
        <ToolButton icon={<Play className="text-emerald-500" />} active={simulationOpen} onClick={() => setSimulationOpen(!simulationOpen)} tooltip="Run Simulation" />
        <ToolButton icon={<Wand2 className="text-purple-500" />} active={aiCommandOpen} onClick={() => setAiCommandOpen(!aiCommandOpen)} tooltip="AI Architect (Cmd+K)" />
        <Separator />
        <ToolButton icon={darkMode ? <Sun /> : <Moon />} onClick={() => setDarkMode(!darkMode)} tooltip="Toggle Theme" />
        <ToolButton icon={<HelpCircle />} active={helpModalOpen} onClick={() => setHelpModalOpen(true)} tooltip="Help" />
      </div>
    </div>
  );
}
