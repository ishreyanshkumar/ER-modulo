import React from 'react';
import { Key, Link as LinkIcon, Triangle } from 'lucide-react';
import { getBounds, getEdgeIntersection } from '../../utils/geometry';

export const Port = React.memo(({ position, setDragConnectStart, node }) => {
  const classes = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    right: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    left: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2'
  };
  return (
    <div onPointerDown={(e) => { e.stopPropagation(); setDragConnectStart(node); }}
      className={`port-handle absolute w-3.5 h-3.5 bg-sky-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 hover:scale-150 transition-all duration-200 cursor-crosshair shadow-md z-30 ${classes[position]}`}
    />
  );
});

export default function Canvas({ 
  canvasRef,
  nodes, edges, selectedItem, pan, zoom,
  isDragging, mousePos, dragConnectStart, 
  handleCanvasPointerDown, handlePointerMove, handlePointerUp, handlePointerDown, handleNodePointerUp, setDragConnectStart,
  updateSelectedNode,
  darkMode
}) {
  return (
    <div 
      ref={canvasRef}
      className={`flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing ${darkMode ? 'bg-[#0a0a0a]' : 'bg-[#f8fafc]'}`}
      style={{}}

      onPointerDown={handleCanvasPointerDown} 
      onPointerMove={handlePointerMove} 
      onPointerUp={handlePointerUp} 
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute top-0 left-0 w-full h-full origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        
        {/* SVG Markers */}
        <svg className="absolute w-0 h-0">
          <defs>
            <marker id="arrow-end" markerWidth="14" markerHeight="14" refX="10" refY="5" orient="auto"><polygon points="0,0 10,5 0,10" fill={darkMode ? "#94a3b8" : "#334155"} /></marker>
            <marker id="arrow-start" markerWidth="14" markerHeight="14" refX="0" refY="5" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill={darkMode ? "#94a3b8" : "#334155"} /></marker>
            <marker id="arrow-end-selected" markerWidth="14" markerHeight="14" refX="10" refY="5" orient="auto"><polygon points="0,0 10,5 0,10" fill="#0284c7" /></marker>
            <marker id="arrow-start-selected" markerWidth="14" markerHeight="14" refX="0" refY="5" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill="#0284c7" /></marker>
          </defs>
        </svg>

        {/* SVG EDGES OVERLAY */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          {edges.map(edge => {
            const srcNode = nodes.find(n => n.id === edge.source);
            const tgtNode = nodes.find(n => n.id === edge.target);
            if (!srcNode || !tgtNode) return null;

            const p1 = getEdgeIntersection(srcNode, getBounds(tgtNode, nodes, edges), nodes, edges);
            const p2 = getEdgeIntersection(tgtNode, getBounds(srcNode, nodes, edges), nodes, edges);
            
            if (!p1 || !p2 || isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) return null;
            
            const isSelected = selectedItem?.type === 'edge' && selectedItem?.id === edge.id;
            const strokeColor = isSelected ? "#0284c7" : (darkMode ? "#64748b" : "#334155");
            
            let drawTargetArrow = (edge.cardinality === '1' && srcNode.shape === 'diamond') || (srcNode.shape === 'isa' && srcNode.parentId === tgtNode.id);
            let drawSourceArrow = (edge.cardinality === '1' && tgtNode.shape === 'diamond') || (tgtNode.shape === 'isa' && tgtNode.parentId === srcNode.id);

            const markerEnd = drawTargetArrow ? (isSelected ? 'url(#arrow-end-selected)' : 'url(#arrow-end)') : 'none';
            const markerStart = drawSourceArrow ? (isSelected ? 'url(#arrow-start-selected)' : 'url(#arrow-start)') : 'none';

            const dx = p2.x - p1.x; const dy = p2.y - p1.y; const len = Math.hypot(dx, dy);
            const nx = len > 0 ? (-dy / len) * 2.5 : 0; const ny = len > 0 ? (dx / len) * 2.5 : 0;
            
            const midX = (p1.x + p2.x) / 2; const midY = (p1.y + p2.y) / 2;

            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer" onPointerDown={(e) => handlePointerDown(e, 'edge', edge)}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={16} />
                {edge.participation === 'total' ? (
                  <>
                    <line x1={p1.x + nx} y1={p1.y + ny} x2={p2.x + nx} y2={p2.y + ny} stroke={strokeColor} strokeWidth={1.5} markerStart={markerStart} markerEnd={markerEnd} />
                    <line x1={p1.x - nx} y1={p1.y - ny} x2={p2.x - nx} y2={p2.y - ny} stroke={strokeColor} strokeWidth={1.5} />
                  </>
                ) : (
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={strokeColor} strokeWidth={1.5} strokeDasharray={edge.dashed ? "6,4" : "none"} markerStart={markerStart} markerEnd={markerEnd} />
                )}
                {edge.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-24" y="-10" width="48" height="20" fill={darkMode ? "#171717" : "white"} rx="4" opacity="0.9" />
                    <text textAnchor="middle" dominantBaseline="middle" dy="1" fontSize="10" fontWeight="bold" fill={darkMode ? "#38bdf8" : "#0369a1"} className="font-sans select-none">{edge.label}</text>
                  </g>
                )}
              </g>
            );
          })}
          {dragConnectStart && !isNaN(mousePos.x) && !isNaN(mousePos.y) && (
            <line 
              x1={getBounds(dragConnectStart, nodes, edges).cx} 
              y1={getBounds(dragConnectStart, nodes, edges).cy} 
              x2={mousePos.x} 
              y2={mousePos.y} 
              stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5,5" 
            />
          )}
        </svg>

        {/* HTML NODES OVERLAY */}
        {nodes.map(node => {
          const bounds = getBounds(node, nodes, edges);
          const isSelected = selectedItem?.type === 'node' && selectedItem?.id === node.id;
          const isCurrentlyDragging = isSelected && isDragging && !dragConnectStart;
          
          if (node.shape === 'aggregation') {
             return (
                <div key={node.id} onPointerDown={(e) => handlePointerDown(e, 'node', node)} onPointerUp={(e) => handleNodePointerUp(e, node)}
                     className={`absolute border-2 border-dashed border-sky-400 bg-sky-50/30 rounded-xl transition-all ${isSelected ? 'ring-2 ring-sky-500 shadow-lg' : ''}`}
                     style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h, zIndex: 0 }}>
                     <div className="absolute -top-6 left-2 text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">{node.name}</div>
                     {!isCurrentlyDragging && <><Port node={node} position="top" setDragConnectStart={setDragConnectStart} /><Port node={node} position="right" setDragConnectStart={setDragConnectStart} /><Port node={node} position="bottom" setDragConnectStart={setDragConnectStart} /><Port node={node} position="left" setDragConnectStart={setDragConnectStart} /></>}
                </div>
             );
          }

          let shapeClasses = `absolute flex items-center justify-center select-none group focus:outline-none
            ${isCurrentlyDragging ? 'scale-105 opacity-90 z-50' : 'transition-all duration-200 ease-out hover:-translate-y-1 z-10'} 
            ${isSelected && !isCurrentlyDragging ? 'z-20' : ''}`;

          const renderedAttrs = node.attributes?.map((attr, i, arr) => ({
            ...attr, isCompositeParent: arr[i+1] && (arr[i+1].indent || 0) > (attr.indent || 0)
          }));

          return (
            <div key={node.id} onPointerDown={(e) => handlePointerDown(e, 'node', node)} onPointerUp={(e) => handleNodePointerUp(e, node)} className={shapeClasses} style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h, borderRadius: node.shape === 'rectangle' ? '12px' : '0' }}>
              {!isCurrentlyDragging && <><Port node={node} position="top" setDragConnectStart={setDragConnectStart} /><Port node={node} position="right" setDragConnectStart={setDragConnectStart} /><Port node={node} position="bottom" setDragConnectStart={setDragConnectStart} /><Port node={node} position="left" setDragConnectStart={setDragConnectStart} /></>}

              {node.shape === 'rectangle' && (
                <div className={`w-full h-full ${darkMode ? 'bg-neutral-900/95 border-neutral-700' : 'bg-white/95 border-neutral-300'} backdrop-blur-sm border flex flex-col rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-sky-500 shadow-xl' : 'shadow-sm group-hover:shadow-md'} transition-all ${node.isWeak ? 'border-[3px] border-double' : ''}`}>
                  <div className={`${node.color || (darkMode ? 'bg-sky-900/40' : 'bg-[#bae6fd]')} ${darkMode ? 'border-neutral-700 text-sky-100' : 'border-neutral-800 text-neutral-900'} border-b h-[32px] flex items-center justify-center font-bold text-[15px] italic tracking-wide transition-colors`}>
                    {node.name}
                  </div>
                  <div className="flex-1 py-1 px-3 flex flex-col gap-1">
                    {renderedAttrs?.map(attr => {
                      let displayName = attr.name;
                      if (attr.isMultivalued) displayName = `{${displayName}}`;
                      if (attr.isDerived) displayName = `${displayName}()`;
                      return (
                        <div key={attr.id} className={`${darkMode ? 'text-neutral-300' : 'text-neutral-800'} text-[12px] flex items-center justify-between h-[24px]`} style={{ paddingLeft: `${(attr.indent || 0) * 12}px` }}>
                          <div className="flex items-center gap-1 truncate pr-2">
                            {attr.isPK && <Key size={10} className="text-amber-500 shrink-0" />}
                            {attr.isFK && !attr.isPK && <LinkIcon size={10} className="text-emerald-500 shrink-0" />}
                            <span className={`truncate ${attr.isPK ? 'underline underline-offset-2 font-bold' : attr.isPartialKey ? `border-b border-dashed ${darkMode ? 'border-neutral-500' : 'border-neutral-800'} font-bold` : 'font-medium'} ${attr.isDerived ? 'italic text-neutral-500' : ''}`}>
                              {displayName}
                            </span>
                          </div>
                          {!attr.isCompositeParent && <span className="text-[10px] text-neutral-500 font-sans font-mono shrink-0">{attr.type}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {node.shape === 'diamond' && (
                <div className={`relative w-full h-full flex items-center justify-center ${isSelected ? 'drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'drop-shadow-sm group-hover:drop-shadow-md'} transition-all`}>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 140 70" preserveAspectRatio="none">
                    {node.isWeak ? (
                      <><polygon points="70,0 140,35 70,70 0,35" fill={darkMode ? "#0c4a6e" : "#e0f2fe"} stroke={isSelected ? '#0ea5e9' : (darkMode ? "#94a3b8" : "#262626")} strokeWidth={isSelected ? '2.5' : '2'} strokeLinejoin="round" /><polygon points="70,6 130,35 70,64 10,35" fill="none" stroke={isSelected ? '#0ea5e9' : (darkMode ? "#94a3b8" : "#262626")} strokeWidth="1.2" strokeLinejoin="round" /></>
                    ) : ( <polygon points="70,0 140,35 70,70 0,35" fill={darkMode ? "#0f172a" : "#f0f9ff"} stroke={isSelected ? '#0ea5e9' : (darkMode ? "#64748b" : "#262626")} strokeWidth={isSelected ? '2.5' : '1.5'} strokeLinejoin="round" /> )}
                  </svg>
                  <span className={`relative z-10 font-bold italic text-[14px] ${darkMode ? 'text-sky-100' : 'text-neutral-900'} px-4 text-center`}>{node.name}</span>
                </div>
              )}

              {node.shape === 'isa' && (
                <div className={`relative w-full h-full flex flex-col items-center justify-center pt-2 ${isSelected ? 'drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'drop-shadow-sm group-hover:drop-shadow-md'} transition-all`}>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 80 70" preserveAspectRatio="none">
                     <polygon points="40,0 80,70 0,70" fill={darkMode ? "#1e293b" : "#ffffff"} stroke={isSelected ? '#0ea5e9' : (darkMode ? "#64748b" : "#262626")} strokeWidth={isSelected ? '2.5' : '1.5'} strokeLinejoin="round" />
                  </svg>
                  <span className={`relative z-10 font-bold text-[14px] ${darkMode ? 'text-sky-100' : 'text-neutral-900'} px-2 mt-2 text-center tracking-widest`}>{node.name}</span>
                  <span className="relative z-10 text-[10px] font-bold text-sky-700 bg-sky-50 rounded-full w-4 h-4 flex items-center justify-center -mt-1 shadow-sm border border-sky-200">{node.constraint === 'overlapping' ? 'o' : 'd'}</span>
                </div>
              )}

              {node.shape === 'attribute' && (
                <div className={`w-full h-full ${darkMode ? 'bg-neutral-900/95 border-neutral-700 text-neutral-200' : 'bg-white/95 border-neutral-300 text-neutral-800'} backdrop-blur-sm border flex items-center justify-center text-[13px] font-medium rounded-full ${isSelected ? 'ring-2 ring-sky-500 shadow-xl' : 'shadow-sm group-hover:shadow-md'} transition-all`}>
                  {node.name}
                </div>
              )}
              
              {node.shape === 'note' && (
                <div className={`w-full h-full bg-amber-100 border-l-4 border-amber-400 p-3 flex flex-col rotate-[0.5deg] ${isSelected ? 'ring-2 ring-amber-500 shadow-xl' : 'shadow-[2px_3px_6px_rgba(0,0,0,0.1)] group-hover:shadow-[4px_6px_10px_rgba(0,0,0,0.12)]'} transition-all`}>
                  <textarea
                    value={node.name}
                    onChange={(e) => updateSelectedNode({ name: e.target.value })}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent border-none outline-none resize-none font-sans text-[14px] leading-relaxed text-amber-900 placeholder-amber-400/70"
                    placeholder="Type a note..."
                  />
                  <div className="text-[10px] text-amber-600/60 font-medium self-end mt-1 italic leading-none">Sticky Note</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
