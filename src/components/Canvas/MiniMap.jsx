import React from 'react';
import { getBounds } from '../../utils/geometry';

export default function MiniMap({ nodes, edges, pan, zoom, darkMode }) {
  if (nodes.length === 0) return null;

  // Find the bounding box of all nodes
  const allBounds = nodes.map(n => getBounds(n, nodes, edges));
  const minX = Math.min(...allBounds.map(b => b.x));
  const minY = Math.min(...allBounds.map(b => b.y));
  const maxX = Math.max(...allBounds.map(b => b.x + b.w));
  const maxY = Math.max(...allBounds.map(b => b.y + b.h));

  const contentW = maxX - minX + 200;
  const contentH = maxY - minY + 200;
  const mapSize = 180;
  const scale = mapSize / Math.max(contentW, contentH);

  // Viewport rectangle
  const viewW = window.innerWidth / zoom;
  const viewH = window.innerHeight / zoom;
  const viewX = -pan.x / zoom;
  const viewY = -pan.y / zoom;

  return (
    <div className={`absolute bottom-6 left-20 w-[${mapSize}px] h-[${mapSize}px] ${darkMode ? 'bg-neutral-900/60 border-neutral-700' : 'bg-white/60 border-white/40'} backdrop-blur-md border rounded-xl shadow-2xl overflow-hidden z-20 pointer-events-none hidden md:block select-none group`}>
      <div className="w-full h-full relative" style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <div style={{ position: 'absolute', left: -minX + 50, top: -minY + 50 }}>
          {/* Render Nodes as simple squares */}
          {nodes.map(node => {
            const b = getBounds(node, nodes, edges);
            return (
              <div 
                key={node.id} 
                className={`absolute ${node.shape === 'rectangle' ? 'bg-sky-500' : node.shape === 'diamond' ? 'bg-amber-500 rotate-45' : 'bg-neutral-400'}`}
                style={{ left: b.x, top: b.y, width: b.w, height: b.h, opacity: 0.6 }}
              />
            );
          })}
          {/* Viewport indicator */}
          <div 
            className="absolute border-2 border-sky-400 bg-sky-400/10"
            style={{ left: viewX, top: viewY, width: viewW, height: viewH }}
          />
        </div>
      </div>
      <div className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider text-neutral-500 opacity-60">MiniMap</div>
    </div>
  );
}
