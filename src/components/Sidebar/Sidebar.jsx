import React from 'react';
import { 
  Settings, MousePointer2, BoxSelect, Copy, AlignHorizontalSpaceAround, AlignVerticalSpaceAround, 
  Trash2, Key, Link as LinkIcon, Plus, X, ChevronLeft, ChevronRight, Palette, Triangle, Hash,
  ChevronDown, Type, Layers
} from 'lucide-react';
import { DATA_TYPES } from '../../hooks/useDiagramState';

export function AttrToggle({ icon, label, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${active ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300' : 'bg-neutral-100/50 text-neutral-500 hover:bg-neutral-200'}`}>
      {icon} {label}
    </button>
  );
}

export default function Sidebar({ 
  selectedItem, nodes, edges, 
  updateSelectedNode, updateEdgeProperties, deleteSelectedItem, 
  handleDuplicate, alignNeighbors, createAggregation, commitAction, clearCanvas,
  darkMode
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const activeNode = selectedItem?.type === 'node' ? nodes.find(n => n.id === selectedItem.id) : null;
  const activeEdge = selectedItem?.type === 'edge' ? edges.find(e => e.id === selectedItem.id) : null;

  const Section = ({ icon, title, children }) => (
    <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
        {icon} <span>{title}</span>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed right-0 top-0 bottom-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] 
        ${isHovered || selectedItem ? 'w-[380px]' : 'w-4'} 
        ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'} 
        border-l shadow-[0_0_50px_rgba(0,0,0,0.1)] group/sidebar`}
    >
      {/* Auto-hide Handle Indicator */}
      {!(isHovered || selectedItem) && (
        <div className={`absolute inset-y-0 left-0 w-1 ${darkMode ? 'bg-neutral-800' : 'bg-neutral-100'} group-hover/sidebar:bg-sky-500 transition-colors animate-pulse`} />
      )}

      <div className={`flex flex-col h-full w-[380px] transition-all duration-300 ${isHovered || selectedItem ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`h-16 ${darkMode ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-100 bg-white/50'} border-b flex items-center px-6 gap-3 font-bold text-lg shrink-0 tracking-tight`}>
          <div className="p-2 bg-sky-500 rounded-lg shadow-lg shadow-sky-500/20">
            <Settings size={18} className="text-white" />
          </div>
          Properties
        </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!selectedItem && (
          <div className={`h-full flex flex-col items-center justify-center ${darkMode ? 'text-neutral-500' : 'text-neutral-400'} text-sm text-center px-4 gap-3`}>
            <MousePointer2 size={32} className="opacity-30" />
            <p>Select an element to edit properties.</p>
          </div>
        )}

        {activeNode && (activeNode.shape === 'rectangle' || activeNode.shape === 'diamond') && (
          <div className="space-y-2">
            <Section icon={<Type size={12}/>} title="General Information">
              <div className="space-y-2">
                <input 
                  type="text" value={activeNode.name} 
                  onChange={(e) => updateSelectedNode({ name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} 
                  onBlur={() => commitAction(nodes, edges)}
                  className={`w-full ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-sky-500/20' : 'bg-white border-neutral-200 focus:ring-sky-500/10'} border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:border-sky-500 transition-all shadow-sm`}
                  placeholder="Entity Name"
                />
                <div className={`flex items-center gap-3 ${darkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-neutral-50/50 border-neutral-200'} p-3 rounded-xl border transition-all`}>
                  <input type="checkbox" checked={activeNode.isWeak} onChange={(e) => updateSelectedNode({ isWeak: e.target.checked }, true)} className="w-4 h-4 accent-sky-500 rounded-lg cursor-pointer" id="weak-toggle" />
                  <label htmlFor="weak-toggle" className={`text-xs font-bold ${darkMode ? 'text-neutral-400' : 'text-neutral-600'} cursor-pointer uppercase tracking-wide`}>
                    {activeNode.shape === 'rectangle' ? 'Weak Entity' : 'Identifying Rel.'}
                  </label>
                </div>
              </div>
            </Section>

            <Section icon={<Palette size={12}/>} title="Visual Style">
               <div className={`flex flex-wrap gap-2.5 p-3 ${darkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-neutral-50/50 border-neutral-200'} rounded-xl border`}>
                  {[
                    'bg-[#bae6fd]', 'bg-[#fecaca]', 'bg-[#bbf7d0]', 'bg-[#fef08a]', 'bg-[#e9d5ff]', 
                    'bg-[#f1f5f9]', 'bg-[#fed7aa]', 'bg-[#fbcfe8]', 'bg-[#d9f99d]', 'bg-[#99f6e4]'
                  ].map(color => (
                    <button 
                      key={color} onClick={() => updateSelectedNode({ color }, true)} 
                      className={`w-7 h-7 rounded-full border-2 ${activeNode.color === color ? 'border-sky-500 scale-110 shadow-lg' : 'border-transparent'} ${color} hover:scale-110 transition-all duration-300`} 
                    />
                  ))}
                </div>
            </Section>

            <Section icon={<Layers size={12}/>} title="Columns & Structure">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">{activeNode.attributes?.length || 0} Attributes</div>
                  <button onClick={() => updateSelectedNode({ attributes: [...(activeNode.attributes || []), { id: `a_${Date.now()}`, name: 'new_col', type: 'VARCHAR(255)', isPK: false, isFK: false, isNullable: true, isPartialKey: false, indent: 0 }] }, true)} 
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${darkMode ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'} transition-all`}>
                    <Plus size={14} /> Add Column
                  </button>
                </div>
                <div className="space-y-2">
                  {activeNode.attributes?.map(attr => (
                    <div key={attr.id} className={`${darkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-white border-neutral-200'} border p-2 rounded-xl shadow-sm space-y-2 group/attr transition-all hover:border-sky-500/50`}>
                      <div className="flex items-center gap-1.5">
                         <button onClick={() => updateSelectedNode({ attributes: (activeNode.attributes || []).filter(a => a.id !== attr.id) }, true)} className="text-neutral-400 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"><X size={14} /></button>
                         <input 
                            value={attr.name} onChange={(e) => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? { ...a, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') } : a) })} 
                            onBlur={() => commitAction(nodes, edges)}
                            className={`w-28 min-w-0 border-none ${darkMode ? 'bg-neutral-900/50 text-neutral-100 p-2' : 'bg-neutral-100/50 p-2'} rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all`} 
                          />
                         <select value={attr.type} onChange={(e) => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? { ...a, type: e.target.value } : a) }, true)} className={`flex-1 border-none ${darkMode ? 'bg-neutral-900/50 text-neutral-400' : 'bg-neutral-100/50 text-neutral-600'} rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-tighter cursor-pointer`}>
                           {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 pl-9">
                         <AttrToggle icon={<Key size={10}/>} label="PK" active={attr.isPK} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isPK: !a.isPK, isPartialKey: false } : a) }, true)} />
                         <AttrToggle icon={<Hash size={10}/>} label="Partial" active={attr.isPartialKey} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isPartialKey: !a.isPartialKey, isPK: false } : a) }, true)} />
                         <AttrToggle icon={<span className="text-[10px]">{'{}'}</span>} label="Multi" active={attr.isMultivalued} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isMultivalued: !a.isMultivalued } : a) }, true)} />
                         <AttrToggle icon={<span className="text-[10px]">{'Ø'}</span>} label="Null" active={attr.isNullable} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isNullable: !a.isNullable } : a) }, true)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section icon={<BoxSelect size={12}/>} title="Actions & Shortcuts">
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleDuplicate} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${darkMode ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300' : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600 shadow-sm'}`}>
                    <Copy size={14} /> Duplicate
                  </button>
                  <button onClick={createAggregation} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${darkMode ? 'bg-sky-500/10 border-sky-900/50 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100 shadow-sm'}`}>
                    <BoxSelect size={14} /> Aggregate
                  </button>
               </div>
            </Section>
          </div>
        )}

        {/* Note Special Case */}
        {activeNode && activeNode.shape === 'note' && (
          <div className="space-y-2">
            <Section icon={<Type size={12}/>} title="Note Content">
              <textarea 
                value={activeNode.name} 
                onChange={(e) => updateSelectedNode({ name: e.target.value })} 
                onBlur={() => commitAction(nodes, edges)}
                className={`w-full h-32 ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-sky-500/20' : 'bg-white border-neutral-200 focus:ring-sky-500/10'} border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:border-sky-500 transition-all shadow-sm resize-none font-serif`}
                placeholder="Type your note here..."
              />
            </Section>
          </div>
        )}

        {/* ISA Special Case */}
        {activeNode && activeNode.shape === 'isa' && (
          <Section icon={<Triangle size={12}/>} title="ISA Specialization">
             <div className="space-y-4">
               <div className={`${darkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-neutral-50/50 border-neutral-200'} border p-4 rounded-xl space-y-3`}>
                  <div className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Superclass Entity</div>
                  {edges.filter(e => e.source === activeNode.id || e.target === activeNode.id).map(edge => {
                    const connectedNode = nodes.find(n => n.id === (edge.source === activeNode.id ? edge.target : edge.source));
                    if (!connectedNode) return null;
                    return (
                      <label key={edge.id} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${activeNode.parentId === connectedNode.id ? (darkMode ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-sky-50 border-sky-500 text-sky-600') : (darkMode ? 'border-transparent bg-neutral-900/50 text-neutral-500' : 'border-transparent bg-white shadow-sm text-neutral-700')}`}>
                         <input type="radio" name={`isa-parent-${activeNode.id}`} checked={activeNode.parentId === connectedNode.id} onChange={() => updateSelectedNode({ parentId: connectedNode.id }, true)} className="accent-sky-500" />
                         <span className="text-sm font-bold">{connectedNode.name}</span>
                       </label>
                    );
                  })}
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <select value={activeNode.constraint || 'disjoint'} onChange={(e) => updateSelectedNode({ constraint: e.target.value }, true)} className={`border-none rounded-xl text-[10px] font-black uppercase p-3 tracking-widest ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
                   <option value="disjoint">Disjoint (d)</option><option value="overlapping">Overlapping (o)</option>
                 </select>
                 <select value={activeNode.completeness || 'partial'} onChange={(e) => updateSelectedNode({ completeness: e.target.value }, true)} className={`border-none rounded-xl text-[10px] font-black uppercase p-3 tracking-widest ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
                   <option value="partial">Partial</option><option value="total">Total</option>
                 </select>
               </div>
             </div>
          </Section>
        )}

        {activeEdge && (
           <Section icon={<LinkIcon size={12}/>} title="Relationship Details">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-[0.1em]">Label / Role</label>
                  <input 
                    type="text" value={activeEdge.label || ''} 
                    onChange={(e) => updateEdgeProperties(activeEdge.id, { label: e.target.value })} 
                    onBlur={() => commitAction(nodes, edges)}
                    placeholder="e.g. 0..N, role_name"
                    className={`w-full ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/20 transition-all shadow-sm`}
                  />
                </div>
                <div className={`flex items-center gap-3 ${darkMode ? 'bg-neutral-800/40 border-neutral-700' : 'bg-neutral-50/50 border-neutral-200'} p-4 rounded-xl border`}>
                  <input type="checkbox" checked={activeEdge.dashed} onChange={(e) => updateEdgeProperties(activeEdge.id, { dashed: e.target.checked }, true)} className="w-4 h-4 accent-sky-500 rounded cursor-pointer" id="dash-toggle" />
                  <label htmlFor="dash-toggle" className={`text-xs font-bold ${darkMode ? 'text-neutral-400' : 'text-neutral-600'} uppercase tracking-wide cursor-pointer`}>
                    Dashed Line
                  </label>
                </div>
              </div>
           </Section>
        )}
      </div>

      <div className={`p-6 ${darkMode ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-100 bg-neutral-50/50'} border-t space-y-3 shrink-0 transition-opacity duration-300 ${isHovered || selectedItem ? 'opacity-100' : 'opacity-0'}`}>
         <button onClick={deleteSelectedItem} disabled={!selectedItem} className={`w-full py-3.5 ${darkMode ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' : 'bg-red-50 hover:bg-neutral-100 text-red-600 border-red-100'} border disabled:opacity-20 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all text-[11px] shadow-sm`}>
          <Trash2 size={16} /> Delete Element
         </button>
         <button onClick={clearCanvas} className={`w-full py-3.5 ${darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700' : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'} border rounded-xl flex items-center justify-center font-black uppercase tracking-widest transition-all text-[11px] shadow-sm`}>
          Reset Canvas
         </button>
      </div>
    </div>
    </div>
  );
}
