import React, { useState, useRef, useEffect } from 'react';
import { 
  MousePointer2, Square, Diamond, Settings, 
  Plus, Trash2, X, Circle, Triangle, BoxSelect,
  ZoomIn, ZoomOut, FileCode2, Database,
  Copy, AlignVerticalSpaceAround, AlignHorizontalSpaceAround,
  Save, Upload, Grid, Palette, Key, Link as LinkIcon,
  Undo, Redo, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';

// --- DATA TYPES ---
const DATA_TYPES = ['INT', 'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'DECIMAL(10,2)'];

// --- ADVANCED GEOMETRY ENGINE ---
const getBounds = (node, allNodes, allEdges) => {
  if (node.shape === 'aggregation') {
    const rel = allNodes.find(n => n.id === node.relId);
    if (!rel) return { x: node.x, y: node.y, w: 100, h: 100, cx: node.x + 50, cy: node.y + 50 };
    
    let minX = rel.x, minY = rel.y;
    let maxX = rel.x + 140, maxY = rel.y + 70; // Default diamond size

    allEdges.filter(e => e.source === rel.id || e.target === rel.id).forEach(e => {
        const otherId = e.source === rel.id ? e.target : e.source;
        const otherNode = allNodes.find(x => x.id === otherId);
        if (otherNode && otherNode.shape !== 'attribute') {
            const w = otherNode.shape === 'rectangle' ? 180 : 100;
            const h = otherNode.shape === 'rectangle' ? 32 + (otherNode.attributes?.length || 0) * 26 + 8 : 100;
            minX = Math.min(minX, otherNode.x);
            minY = Math.min(minY, otherNode.y);
            maxX = Math.max(maxX, otherNode.x + w);
            maxY = Math.max(maxY, otherNode.y + h);
        }
    });
    const pad = 24;
    const w = (maxX - minX) + pad * 2;
    const h = (maxY - minY) + pad * 2;
    return { x: minX - pad, y: minY - pad, w, h, cx: minX - pad + w/2, cy: minY - pad + h/2 };
  }

  let w = 100, h = 100;
  if (node.shape === 'diamond') { w = 140; h = 70; }
  else if (node.shape === 'isa') { w = 80; h = 70; }
  else if (node.shape === 'attribute') { w = 90; h = 36; }
  else if (node.shape === 'rectangle') { w = 180; h = 32 + (node.attributes?.length || 0) * 26 + 8; }
  
  return { x: node.x, y: node.y, w, h, cx: node.x + w/2, cy: node.y + h/2 };
};

const getEdgeIntersection = (sourceNode, targetPt, allNodes, allEdges) => {
  const bounds = getBounds(sourceNode, allNodes, allEdges);
  const cx = bounds.cx;
  const cy = bounds.cy;

  const tx = targetPt.cx !== undefined ? targetPt.cx : targetPt.x;
  const ty = targetPt.cy !== undefined ? targetPt.cy : targetPt.y;
  
  const dx = tx - cx;
  const dy = ty - cy;
  
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  if (sourceNode.shape === 'isa') {
    const r = 35; const dist = Math.hypot(dx, dy);
    return { x: cx + dx * r / dist, y: cy + dy * r / dist };
  } else if (sourceNode.shape === 'diamond') {
    const scale = 1 / (Math.abs(dx) / (bounds.w / 2) + Math.abs(dy) / (bounds.h / 2));
    return { x: cx + dx * scale, y: cy + dy * scale };
  } else {
    const slope = dy / dx;
    const aspect = bounds.h / bounds.w;
    let x, y;
    if (Math.abs(slope) < aspect) {
      x = dx > 0 ? cx + bounds.w / 2 : cx - bounds.w / 2;
      y = cy + slope * (x - cx);
    } else {
      y = dy > 0 ? cy + bounds.h / 2 : cy - bounds.h / 2;
      x = cx + (y - cy) / slope;
    }
    return { x, y };
  }
};

// --- INITIAL STATE DATA ---
const initialNodes = [
  { id: 'n1', shape: 'rectangle', name: 'instructor', x: 100, y: 150, isWeak: false, color: 'bg-[#bae6fd]', attributes: [
    { id: 'a1', name: 'ID', type: 'INT', isPK: true, isFK: false, isNullable: false, isPartialKey: false, indent: 0 }, 
    { id: 'a2', name: 'name', type: 'VARCHAR(255)', indent: 0 }
  ]},
  { id: 'n2', shape: 'diamond', name: 'proj_guide', x: 400, y: 150, isWeak: false }, 
  { id: 'n3', shape: 'rectangle', name: 'student', x: 700, y: 150, isWeak: false, color: 'bg-[#bae6fd]', attributes: [
    { id: 'a3', name: 's_id', type: 'INT', isPK: true, indent: 0 }
  ]},
  { id: 'agg1', shape: 'aggregation', name: 'project_team', relId: 'n2', x: 0, y: 0 },
  { id: 'n4', shape: 'diamond', name: 'eval_for', x: 400, y: 350, isWeak: false },
  { id: 'n5', shape: 'rectangle', name: 'evaluation', x: 400, y: 500, isWeak: false, color: 'bg-[#bae6fd]', attributes: [
    { id: 'a4', name: 'eval_id', type: 'INT', isPK: true, indent: 0 },
    { id: 'a5', name: 'score', type: 'INT', indent: 0 }
  ]}
];

const initialEdges = [
  { id: 'e1', source: 'n2', target: 'n1', cardinality: 'N', participation: 'partial', label: 'guides' },
  { id: 'e2', source: 'n2', target: 'n3', cardinality: 'M', participation: 'total', label: 'works_on' },
  { id: 'e3', source: 'n4', target: 'agg1', cardinality: '1', participation: 'partial' },
  { id: 'e4', source: 'n4', target: 'n5', cardinality: 'N', participation: 'total' }
];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // History State
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const lastSavedState = useRef({ nodes: initialNodes, edges: initialEdges });

  // Viewport
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState('select'); 
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Interaction State
  const [selectedItem, setSelectedItem] = useState(null); 
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragConnectStart, setDragConnectStart] = useState(null);
  
  // Compiler State
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState({ format: 'sql', isaMethod: 'method1' });

  // --- HISTORY MANAGEMENT ---
  const commitAction = (newNodes, newEdges) => {
    if (JSON.stringify(lastSavedState.current.nodes) === JSON.stringify(newNodes) && 
        JSON.stringify(lastSavedState.current.edges) === JSON.stringify(newEdges)) return;
    setPast(prev => [...prev, lastSavedState.current]);
    setFuture([]);
    lastSavedState.current = { nodes: newNodes, edges: newEdges };
    setNodes(newNodes); setEdges(newEdges);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture(prev => [lastSavedState.current, ...prev]);
    lastSavedState.current = previous;
    setPast(past.slice(0, past.length - 1));
    setNodes(previous.nodes); setEdges(previous.edges); setSelectedItem(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(prev => [...prev, lastSavedState.current]);
    lastSavedState.current = next;
    setFuture(future.slice(1));
    setNodes(next.nodes); setEdges(next.edges); setSelectedItem(null);
  };

  // --- INTERACTION HANDLERS ---
  const getPos = (e) => ({ clientX: e.clientX ?? e.touches?.[0]?.clientX ?? 0, clientY: e.clientY ?? e.touches?.[0]?.clientY ?? 0 });

  const handlePointerDown = (e, type, item) => {
    e.stopPropagation();
    if (mode === 'select') {
      setSelectedItem({ type, id: item.id });
      if (type === 'node') {
        setIsDragging(true);
        const { clientX, clientY } = getPos(e);
        let rawX = (clientX - pan.x) / zoom; let rawY = (clientY - pan.y) / zoom;
        const bounds = getBounds(item, nodes, edges);
        setDragOffset({ x: rawX - bounds.x, y: rawY - bounds.y });
      }
    }
  };

  const handlePointerMove = (e) => {
    const { clientX, clientY } = getPos(e);
    let rawX = (clientX - pan.x) / zoom; let rawY = (clientY - pan.y) / zoom;
    if (isNaN(rawX) || isNaN(rawY)) return;
    setMousePos({ x: rawX, y: rawY });

    if (isDragging && selectedItem?.type === 'node' && !dragConnectStart) {
      const activeNode = nodes.find(n => n.id === selectedItem.id);
      if(activeNode && activeNode.shape === 'aggregation') return; 

      if (snapToGrid) { rawX = Math.round(rawX / 24) * 24; rawY = Math.round(rawY / 24) * 24; }
      setNodes(nodes.map(n => n.id === selectedItem.id ? { ...n, x: rawX - dragOffset.x, y: rawY - dragOffset.y } : n));
    } else if (isDragging && mode === 'select' && !selectedItem && !dragConnectStart) {
      setPan({ x: pan.x + e.movementX, y: pan.y + e.movementY });
    }
  };

  const handlePointerUp = () => {
    if (isDragging && !dragConnectStart) commitAction(nodes, edges);
    setIsDragging(false); setDragConnectStart(null);
  };

  const handleNodePointerUp = (e, targetNode) => {
    e.stopPropagation();
    if (dragConnectStart && dragConnectStart.id !== targetNode.id) {
      const src = dragConnectStart; const tgt = targetNode;
      let newNodes = [...nodes]; let newEdges = [...edges];

      if (src.shape === 'rectangle' && tgt.shape === 'rectangle') {
        const midX = (src.x + tgt.x) / 2; const midY = (src.y + tgt.y) / 2;
        const newDiamondId = `node_${Date.now()}`;
        newNodes.push({ id: newDiamondId, shape: 'diamond', name: `rel_${src.name}`, x: midX, y: midY, isWeak: false });
        newEdges.push(
          { id: `edge_${Date.now()}_1`, source: newDiamondId, target: src.id, cardinality: '1', participation: 'partial' },
          { id: `edge_${Date.now()}_2`, source: newDiamondId, target: tgt.id, cardinality: 'N', participation: 'partial' }
        );
      } else {
        newEdges.push({ id: `edge_${Date.now()}`, source: src.id, target: tgt.id, cardinality: 'N', participation: 'partial' });
      }
      commitAction(newNodes, newEdges);
    }
    setIsDragging(false); setDragConnectStart(null);
  };

  const handleCanvasPointerDown = (e) => {
    const { clientX, clientY } = getPos(e);
    let rawX = (clientX - pan.x) / zoom; let rawY = (clientY - pan.y) / zoom;
    if (isNaN(rawX) || isNaN(rawY)) return;
    if (snapToGrid) { rawX = Math.round(rawX / 24) * 24; rawY = Math.round(rawY / 24) * 24; }

    if (['add-rect', 'add-dia', 'add-attr', 'add-isa'].includes(mode)) {
      const shapeMap = { 'add-rect': 'rectangle', 'add-dia': 'diamond', 'add-attr': 'attribute', 'add-isa': 'isa' };
      const newNode = {
        id: `node_${Date.now()}`, shape: shapeMap[mode], name: shapeMap[mode] === 'isa' ? 'ISA' : `new_${shapeMap[mode]}`, 
        x: rawX - 60, y: rawY - 30, isWeak: false, color: 'bg-[#bae6fd]',
        attributes: shapeMap[mode] === 'rectangle' ? [{ id: `a_${Date.now()}`, name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, indent: 0 }] : undefined,
        constraint: shapeMap[mode] === 'isa' ? 'disjoint' : undefined, completeness: shapeMap[mode] === 'isa' ? 'partial' : undefined
      };
      commitAction([...nodes, newNode], edges);
      setMode('select'); setSelectedItem({ type: 'node', id: newNode.id });
    } else if (mode === 'select') {
      setSelectedItem(null); setIsDragging(true);
    }
  };

  // --- EDITING LOGIC ---
  const updateSelectedNode = (updates, commit = false) => {
    const newNodes = nodes.map(n => n.id === selectedItem?.id ? { ...n, ...updates } : n);
    if (commit) commitAction(newNodes, edges); else setNodes(newNodes);
  };
  const updateEdgeProperties = (edgeId, updates, commit = false) => {
    const newEdges = edges.map(e => e.id === edgeId ? { ...e, ...updates } : e);
    if (commit) commitAction(nodes, newEdges); else setEdges(newEdges);
  };
  
  const deleteSelectedItem = () => {
    if (!selectedItem) return;
    let newNodes = nodes; let newEdges = edges;
    if (selectedItem.type === 'node') {
      newNodes = nodes.filter(n => n.id !== selectedItem.id && n.relId !== selectedItem.id); 
      newEdges = edges.filter(e => e.source !== selectedItem.id && e.target !== selectedItem.id);
    } else {
      newEdges = edges.filter(e => e.id !== selectedItem.id);
    }
    commitAction(newNodes, newEdges); setSelectedItem(null);
  };

  const handleDuplicate = () => {
    const activeNode = nodes.find(n => n.id === selectedItem?.id);
    if (!activeNode) return;
    const newNode = { ...activeNode, id: `node_${Date.now()}`, x: activeNode.x + 40, y: activeNode.y + 40 };
    if (newNode.attributes) newNode.attributes = newNode.attributes.map(a => ({ ...a, id: `a_${Date.now()}_${Math.random()}` }));
    commitAction([...nodes, newNode], edges); setSelectedItem({ type: 'node', id: newNode.id });
  };

  const alignNeighbors = (axis) => {
    const activeNode = nodes.find(n => n.id === selectedItem?.id);
    if (!activeNode) return;
    const connectedIds = new Set();
    edges.forEach(e => {
      if (e.source === activeNode.id) connectedIds.add(e.target);
      if (e.target === activeNode.id) connectedIds.add(e.source);
    });
    commitAction(nodes.map(n => connectedIds.has(n.id) ? { ...n, [axis]: activeNode[axis] } : n), edges);
  };

  const createAggregation = () => {
    if(selectedItem?.type !== 'node') return;
    const activeNode = nodes.find(n => n.id === selectedItem.id);
    if(activeNode.shape !== 'diamond') return;
    const newAgg = { id: `agg_${Date.now()}`, shape: 'aggregation', relId: activeNode.id, name: `agg_${activeNode.name}`, x: 0, y: 0 };
    commitAction([...nodes, newAgg], edges);
  };

  // --- SAVE / LOAD ---
  const handleSave = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "er_workspace.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.nodes && data.edges) {
          setPast([]); setFuture([]);
          lastSavedState.current = { nodes: data.nodes, edges: data.edges };
          setNodes(data.nodes);
          setEdges(data.edges);
          setSelectedItem(null);
        }
      } catch (err) { alert("Invalid workspace file"); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // --- FULL RELATIONAL ALGEBRA COMPILER ---
  const buildSchema = (method = 'method1') => {
    let rels = new Map();

    nodes.filter(n => n.shape === 'rectangle').forEach(ent => {
      let cols = [];
      let multiValued = [];
      
      ent.attributes?.forEach((attr, i, arr) => {
        if (attr.isDerived) return;
        const indent = attr.indent || 0;
        const isParent = arr[i+1] && (arr[i+1].indent || 0) > indent;
        if (isParent) return; 

        let fullName = attr.name;
        if (indent > 0) { 
          let prefix = ""; let curr = indent;
          for (let j = i - 1; j >= 0; j--) {
            if ((arr[j].indent || 0) < curr) { prefix = arr[j].name + "_" + prefix; curr = arr[j].indent || 0; }
            if (curr === 0) break;
          }
          fullName = prefix + attr.name;
        }

        const colDef = { name: fullName, type: attr.type, isPK: attr.isPK, isNullable: attr.isNullable, isPartialKey: attr.isPartialKey };
        if (attr.isMultivalued) multiValued.push(colDef);
        else cols.push(colDef);
      });
      rels.set(ent.id, { id: ent.id, name: ent.name, columns: cols, multiValued, isWeak: ent.isWeak });
    });

    const getEntityPKs = (entId) => {
      const r = rels.get(entId);
      if (!r) return [];
      return r.columns.filter(c => c.isPK || c.isPartialKey).map(c => ({...c, refTable: r.name, refCol: c.name}));
    };

    nodes.filter(n => n.shape === 'diamond' && n.isWeak).forEach(dia => {
      const diaEdges = edges.filter(e => e.source === dia.id || e.target === dia.id);
      const weakEdge = diaEdges.find(e => nodes.find(n => n.id === (e.source === dia.id ? e.target : e.source))?.isWeak);
      const strongEdge = diaEdges.find(e => e !== weakEdge);
      
      if (weakEdge && strongEdge) {
         const weakId = weakEdge.source === dia.id ? weakEdge.target : weakEdge.source;
         const strongId = strongEdge.source === dia.id ? strongEdge.target : strongEdge.source;
         
         const strongPKs = getEntityPKs(strongId);
         const weakRel = rels.get(weakId);
         if (weakRel) {
             strongPKs.forEach(pk => {
                 weakRel.columns.unshift({ name: `${pk.refTable}_${pk.name}`, type: pk.type, isPK: true, isFK: true, refTable: pk.refTable, refCol: pk.refCol });
             });
             weakRel.columns.forEach(c => { if(c.isPartialKey) { c.isPK = true; c.isPartialKey = false; } });
         }
      }
      dia._processed = true; 
    });

    nodes.filter(n => n.shape === 'isa').forEach(isa => {
      const parentRel = rels.get(isa.parentId);
      if (!parentRel) return;
      const childIds = edges.filter(e => e.source === isa.id || e.target === isa.id).map(e => e.source === isa.id ? e.target : e.source).filter(id => id !== isa.parentId);

      if (method === 'method1') {
          const parentPKs = getEntityPKs(isa.parentId);
          childIds.forEach(cId => {
              const cRel = rels.get(cId);
              if (cRel) {
                  parentPKs.forEach(pk => cRel.columns.unshift({ name: pk.name, type: pk.type, isPK: true, isFK: true, refTable: parentRel.name, refCol: pk.name }));
              }
          });
      } else if (method === 'method2') {
          childIds.forEach(cId => {
              const cRel = rels.get(cId);
              if (cRel) cRel.columns = [...parentRel.columns, ...cRel.columns];
          });
          parentRel._deleted = true;
      }
    });

    const getIdentifier = (nodeId) => {
       const node = nodes.find(n => n.id === nodeId);
       if (!node) return [];
       if (node.shape === 'rectangle') return getEntityPKs(node.id);
       if (node.shape === 'aggregation') return getIdentifier(node.relId); 
       if (node.shape === 'diamond') {
           const connEdges = edges.filter(e => e.source === node.id || e.target === node.id);
           let pks = [];
           connEdges.forEach(e => {
               const otherId = e.source === node.id ? e.target : e.source;
               const otherNode = nodes.find(n => n.id === otherId);
               if (otherNode && (otherNode.shape === 'rectangle' || otherNode.shape === 'aggregation')) {
                   pks.push(...getIdentifier(otherId));
               }
           });
           return pks;
       }
       return [];
    };

    let junctionTables = [];
    nodes.filter(n => n.shape === 'diamond' && !n._processed).forEach(dia => {
      const diaEdges = edges.filter(e => e.source === dia.id || e.target === dia.id);
      const connections = diaEdges.map(edge => {
          const otherId = edge.source === dia.id ? edge.target : edge.source;
          const otherNode = nodes.find(n => n.id === otherId);
          if (otherNode && (otherNode.shape === 'rectangle' || otherNode.shape === 'aggregation')) {
              return { node: otherNode, edge, pks: getIdentifier(otherId) };
          }
          return null;
      }).filter(Boolean);

      if (connections.length >= 2) {
          const isMN = connections.every(c => c.edge.cardinality === 'N' || c.edge.cardinality === 'M') || connections.length > 2;
          const hasAgg = connections.some(c => c.node.shape === 'aggregation');
          
          if (isMN || hasAgg) {
              let cols = [];
              connections.forEach(c => {
                  c.pks.forEach(pk => {
                      cols.push({ name: `${c.node.name}_${pk.name}`, type: pk.type, isPK: true, isFK: true, refTable: pk.refTable, refCol: pk.refCol });
                  });
              });
              edges.filter(e => e.source === dia.id || e.target === dia.id).forEach(e => {
                  const otherId = e.source === dia.id ? e.target : e.source;
                  const otherNode = nodes.find(n => n.id === otherId);
                  if (otherNode && otherNode.shape === 'attribute') cols.push({ name: otherNode.name, type: 'VARCHAR(255)', isNullable: true });
              });
              junctionTables.push({ name: dia.name, columns: cols, isJunction: true });
          } else {
              let oneSide, nSide;
              if (connections.some(c => c.edge.cardinality === '1') && connections.some(c => c.edge.cardinality === 'N')) {
                  oneSide = connections.find(c => c.edge.cardinality === '1');
                  nSide = connections.find(c => c.edge.cardinality === 'N');
              } else if (connections.every(c => c.edge.cardinality === '1')) {
                  nSide = connections.find(c => c.edge.participation === 'total') || connections[0];
                  oneSide = connections.find(c => c !== nSide);
              }

              if (oneSide && nSide && nSide.node.shape === 'rectangle') {
                  const nRel = rels.get(nSide.node.id);
                  if (nRel) {
                      oneSide.pks.forEach(pk => {
                          nRel.columns.push({ name: `${oneSide.node.name}_${pk.name}`, type: pk.type, isFK: true, refTable: pk.refTable, refCol: pk.refCol, isNullable: nSide.edge.participation !== 'total' });
                      });
                  }
              }
          }
      }
    });

    let multiTables = [];
    Array.from(rels.values()).forEach(rel => {
        if (rel._deleted) return;
        rel.multiValued.forEach(mv => {
            let cols = getEntityPKs(rel.id).map(pk => ({ name: `${pk.refTable}_${pk.name}`, type: pk.type, isPK: true, isFK: true, refTable: pk.refTable, refCol: pk.refCol }));
            cols.push({ name: mv.name, type: mv.type, isPK: true });
            multiTables.push({ name: `${rel.name}_${mv.name}`, columns: cols, isJunction: true });
        });
    });

    return { entities: Array.from(rels.values()).filter(r => !r._deleted), junctions: [...junctionTables, ...multiTables] };
  };

  const buildSQLText = (schema) => {
      let sql = `-- COMPILED SQL DDL\n-- Supports ISA, Weak Entities, Multivalued, Composite, and Aggregation.\n\n`;
      const allTables = [...schema.entities, ...schema.junctions];
      
      allTables.forEach(t => {
          sql += `CREATE TABLE ${t.name} (\n`;
          let colDefs = []; let pks = []; let fks = [];

          t.columns.forEach(c => {
              let def = `  ${c.name} ${c.type}`;
              if (!c.isNullable && !c.isPK) def += ` NOT NULL`;
              colDefs.push(def);
              if (c.isPK) pks.push(c.name);
              if (c.isFK) fks.push(`  FOREIGN KEY (${c.name}) REFERENCES ${c.refTable}(${c.refCol}) ON DELETE CASCADE`);
          });

          if (pks.length > 0) colDefs.push(`  PRIMARY KEY (${pks.join(', ')})`);
          fks.forEach(fk => colDefs.push(fk));
          sql += colDefs.join(',\n') + `\n);\n\n`;
      });
      return sql;
  };

  const buildRelationalText = (schema) => {
      let text = "RELATIONAL SCHEMA (Textbook Format):\n\n";
      const allTables = [...schema.entities, ...schema.junctions];
      allTables.forEach(t => {
          let cols = t.columns.map(c => {
              let s = c.name;
              if (c.isPK) s = `[PK] ${s}`;
              if (c.isFK) s = `${s} (FK -> ${c.refTable}.${c.refCol})`;
              return s;
          });
          text += `${t.name} ( ${cols.join(', ')} )\n`;
      });
      return text;
  };

  // --- SAFE SYNTAX HIGHLIGHTING RENDERERS ---
  const renderHighlightedSQL = (text) => {
      // FIX: Replace numbers BEFORE replacing keywords to prevent regex from destroying HTML span class attributes!
      const html = text
          .replace(/</g, "&lt;").replace(/>/g, "&gt;") // 1. Escape HTML
          .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>') // 2. Safe Number Injection
          .replace(/(--.*)/g, '<span class="text-neutral-500 italic">$1</span>') // 3. Comments
          .replace(/\b(CREATE TABLE|PRIMARY KEY|FOREIGN KEY|REFERENCES|ON DELETE CASCADE|NOT NULL)\b/g, '<span class="text-pink-500 font-semibold">$1</span>') // 4. Keywords
          .replace(/\b(INT|VARCHAR|DECIMAL|TEXT|BOOLEAN|DATE|TIMESTAMP)\b/g, '<span class="text-sky-500 font-semibold">$1</span>'); // 5. Types
      return { __html: html };
  };

  const renderHighlightedSchema = (text) => {
      const html = text
          .replace(/</g, "&lt;").replace(/>/g, "&gt;") 
          .replace(/^(RELATIONAL SCHEMA.*)/g, '<span class="text-neutral-500 italic">$1</span>')
          .replace(/^([A-Za-z0-9_]+)(\s*\()/gm, '<span class="text-sky-400 font-bold">$1</span>$2') 
          .replace(/\[PK\]/g, '<span class="text-amber-500 font-bold">[PK]</span>') 
          .replace(/\(FK -> ([^)]+)\)/g, '<span class="text-emerald-500 font-bold">(FK -> <span class="text-emerald-300">$1</span>)</span>'); 
      return { __html: html };
  };

  const activeNode = selectedItem?.type === 'node' ? nodes.find(n => n.id === selectedItem.id) : null;
  const activeEdge = selectedItem?.type === 'edge' ? edges.find(e => e.id === selectedItem.id) : null;

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] text-neutral-800 overflow-hidden font-serif selection:bg-sky-200 relative">
      
      {/* SVG Markers for Arrows */}
      <svg className="absolute w-0 h-0">
        <defs>
          <marker id="arrow-end" markerWidth="14" markerHeight="14" refX="10" refY="5" orient="auto"><polygon points="0,0 10,5 0,10" fill="#262626" /></marker>
          <marker id="arrow-start" markerWidth="14" markerHeight="14" refX="0" refY="5" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill="#262626" /></marker>
          <marker id="arrow-end-selected" markerWidth="14" markerHeight="14" refX="10" refY="5" orient="auto"><polygon points="0,0 10,5 0,10" fill="#0284c7" /></marker>
          <marker id="arrow-start-selected" markerWidth="14" markerHeight="14" refX="0" refY="5" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill="#0284c7" /></marker>
        </defs>
      </svg>

      {/* LEFT TOOLBAR */}
      <div className="w-16 bg-white/90 backdrop-blur-md border-r border-white/40 flex flex-col items-center py-4 gap-4 z-20 shadow-[10px_0_30px_rgba(0,0,0,0.03)] relative overflow-y-auto custom-scrollbar">
        <ToolButton icon={<MousePointer2 size={20} />} active={mode === 'select'} onClick={() => setMode('select')} tooltip="Select & Move (V)" />
        <div className="w-8 h-px bg-neutral-200 shrink-0" />
        <ToolButton icon={<Square size={20} />} active={mode === 'add-rect'} onClick={() => setMode('add-rect')} tooltip="Add Entity Table" />
        <ToolButton icon={<Diamond size={20} />} active={mode === 'add-dia'} onClick={() => setMode('add-dia')} tooltip="Add Relationship Diamond" />
        <ToolButton icon={<Triangle size={20} />} active={mode === 'add-isa'} onClick={() => setMode('add-isa')} tooltip="Add ISA (Inheritance)" />
        <ToolButton icon={<Circle size={20} />} active={mode === 'add-attr'} onClick={() => setMode('add-attr')} tooltip="Add Loose Attribute" />
        <div className="w-8 h-px bg-neutral-200 shrink-0" />
        <ToolButton icon={<Undo size={20} />} onClick={undo} disabled={past.length === 0} tooltip="Undo" />
        <ToolButton icon={<Redo size={20} />} onClick={redo} disabled={future.length === 0} tooltip="Redo" />
        <div className="w-8 h-px bg-neutral-200 shrink-0" />
        <ToolButton icon={<Grid size={20} />} active={snapToGrid} onClick={() => setSnapToGrid(!snapToGrid)} tooltip="Toggle Grid Snapping" />
        <ToolButton icon={<ZoomIn size={20} />} onClick={() => setZoom(z => Math.min(z + 0.1, 2))} tooltip="Zoom In" />
        <ToolButton icon={<ZoomOut size={20} />} onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} tooltip="Zoom Out" />
        <div className="w-8 h-px bg-neutral-200 shrink-0" />
        <ToolButton icon={<Save size={20} />} onClick={handleSave} tooltip="Save Workspace" />
        <label className="relative p-3 rounded-xl transition-all duration-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 hover:shadow-sm cursor-pointer group shrink-0" title="Load Workspace">
          <Upload size={20} />
          <input type="file" accept=".json" onChange={handleLoad} className="hidden" />
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-neutral-800 text-white text-[11px] font-sans font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-all translate-x-1 group-hover:translate-x-0">Load</div>
        </label>
        <ToolButton icon={<FileCode2 size={20} />} onClick={() => setSqlModalOpen(true)} tooltip="Compile Relational Schema" />
      </div>

      {/* MAIN CANVAS */}
      <div 
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: `${24 * zoom}px ${24 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
        onPointerDown={handleCanvasPointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
      >
        <div className="absolute top-0 left-0 w-full h-full origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          
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
              const strokeColor = isSelected ? "#0284c7" : "#334155";
              
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
                      <rect x="-24" y="-10" width="48" height="20" fill="white" rx="4" opacity="0.9" />
                      <text textAnchor="middle" dominantBaseline="middle" dy="1" fontSize="10" fontWeight="bold" fill="#0369a1" className="font-sans select-none">{edge.label}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {dragConnectStart && !isNaN(mousePos.x) && !isNaN(mousePos.y) && (
              <line x1={getBounds(dragConnectStart, nodes, edges).cx} y1={getBounds(dragConnectStart, nodes, edges).cy} x2={mousePos.x} y2={mousePos.y} stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5,5" />
            )}
          </svg>

          {/* HTML NODES OVERLAY */}
          {nodes.map(node => {
            const bounds = getBounds(node, nodes, edges);
            const isSelected = selectedItem?.type === 'node' && selectedItem?.id === node.id;
            const isCurrentlyDragging = isSelected && isDragging && !dragConnectStart;
            
            // AGGREGATION RENDERING (Behind everything else)
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

            let shapeClasses = `absolute flex items-center justify-center select-none group 
              ${isCurrentlyDragging ? 'scale-105 shadow-2xl opacity-90 z-50' : 'transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl shadow-md z-10'} 
              ${isSelected && !isCurrentlyDragging ? 'ring-2 ring-sky-500 shadow-xl z-20' : ''}`;

            const renderedAttrs = node.attributes?.map((attr, i, arr) => ({
              ...attr, isCompositeParent: arr[i+1] && (arr[i+1].indent || 0) > (attr.indent || 0)
            }));

            return (
              <div key={node.id} onPointerDown={(e) => handlePointerDown(e, 'node', node)} onPointerUp={(e) => handleNodePointerUp(e, node)} className={shapeClasses} style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h, borderRadius: node.shape === 'rectangle' ? '12px' : '0' }}>
                {!isCurrentlyDragging && <><Port node={node} position="top" setDragConnectStart={setDragConnectStart} /><Port node={node} position="right" setDragConnectStart={setDragConnectStart} /><Port node={node} position="bottom" setDragConnectStart={setDragConnectStart} /><Port node={node} position="left" setDragConnectStart={setDragConnectStart} /></>}

                {/* ENTITY RECTANGLE */}
                {node.shape === 'rectangle' && (
                  <div className={`w-full h-full bg-white/95 backdrop-blur-sm border border-neutral-800 flex flex-col rounded-xl overflow-hidden ${node.isWeak ? 'border-[3px] border-double' : ''}`}>
                    <div className={`${node.color || 'bg-[#bae6fd]'} border-b border-neutral-800 h-[32px] flex items-center justify-center font-bold text-[15px] italic text-neutral-900 tracking-wide transition-colors`}>
                      {node.name}
                    </div>
                    <div className="flex-1 py-1 px-3 flex flex-col gap-1">
                      {renderedAttrs?.map(attr => {
                        let displayName = attr.name;
                        if (attr.isMultivalued) displayName = `{${displayName}}`;
                        if (attr.isDerived) displayName = `${displayName}()`;
                        return (
                          <div key={attr.id} className="text-[12px] text-neutral-800 flex items-center justify-between h-[24px]" style={{ paddingLeft: `${(attr.indent || 0) * 12}px` }}>
                            <div className="flex items-center gap-1 truncate pr-2">
                              {attr.isPK && <Key size={10} className="text-amber-600 shrink-0" />}
                              {attr.isFK && !attr.isPK && <LinkIcon size={10} className="text-emerald-600 shrink-0" />}
                              <span className={`truncate ${attr.isPK ? 'underline underline-offset-2 font-bold' : attr.isPartialKey ? 'border-b border-dashed border-neutral-800 font-bold' : 'font-medium'} ${attr.isDerived ? 'italic text-neutral-500' : ''}`}>
                                {displayName}
                              </span>
                            </div>
                            {!attr.isCompositeParent && <span className="text-[10px] text-neutral-400 font-sans font-mono shrink-0">{attr.type}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* RELATIONSHIP DIAMOND */}
                {node.shape === 'diamond' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 140 70" preserveAspectRatio="none">
                      {node.isWeak ? (
                        <><polygon points="70,0 140,35 70,70 0,35" fill="#e0f2fe" stroke="#262626" strokeWidth="2" strokeLinejoin="round" /><polygon points="70,6 130,35 70,64 10,35" fill="none" stroke="#262626" strokeWidth="1.2" strokeLinejoin="round" /></>
                      ) : ( <polygon points="70,0 140,35 70,70 0,35" fill="#f0f9ff" stroke="#262626" strokeWidth="1.5" strokeLinejoin="round" /> )}
                    </svg>
                    <span className="relative z-10 font-bold italic text-[14px] text-neutral-900 px-4 text-center">{node.name}</span>
                  </div>
                )}

                {/* ISA TRIANGLE */}
                {node.shape === 'isa' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center pt-2">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 80 70" preserveAspectRatio="none">
                       <polygon points="40,0 80,70 0,70" fill="#ffffff" stroke="#262626" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    <span className="relative z-10 font-bold text-[14px] text-neutral-900 px-2 mt-2 text-center tracking-widest">{node.name}</span>
                    <span className="relative z-10 text-[10px] font-bold text-sky-700 bg-sky-50 rounded-full w-4 h-4 flex items-center justify-center -mt-1 shadow-sm border border-sky-200">{node.constraint === 'overlapping' ? 'o' : 'd'}</span>
                  </div>
                )}

                {/* STANDALONE ATTRIBUTE */}
                {node.shape === 'attribute' && (
                  <div className="w-full h-full bg-white/95 backdrop-blur-sm border border-neutral-800 flex items-center justify-center text-[13px] text-neutral-800 font-medium rounded-full">
                    {node.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-[360px] bg-white/80 backdrop-blur-xl border-l border-white/40 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-20 font-sans absolute right-0 top-0 bottom-0 pointer-events-auto">
        <div className="h-14 border-b border-neutral-200/50 flex items-center px-4 gap-2 font-semibold text-neutral-800 bg-white/50 shrink-0">
          <Settings size={18} className="text-neutral-500" /> Properties
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {!selectedItem && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-sm text-center px-4 gap-3">
              <MousePointer2 size={32} className="opacity-30" />
              <p>Select an element to edit properties.</p>
            </div>
          )}

          {activeNode && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              <div className="flex justify-between items-center bg-white/60 p-1.5 rounded-lg border border-neutral-200/50 shadow-sm">
                {activeNode.shape === 'diamond' && <button onClick={createAggregation} title="Wrap in Aggregation Box" className="p-2 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"><BoxSelect size={16} /></button>}
                <button onClick={handleDuplicate} title="Duplicate Node" className="p-2 text-neutral-600 hover:text-sky-600 hover:bg-white rounded-md transition-colors"><Copy size={16} /></button>
                <div className="w-px h-4 bg-neutral-300"></div>
                <button onClick={() => alignNeighbors('y')} title="Align Connected Horizontally" className="p-2 text-neutral-600 hover:text-sky-600 hover:bg-white rounded-md transition-colors"><AlignHorizontalSpaceAround size={16} /></button>
                <button onClick={() => alignNeighbors('x')} title="Align Connected Vertically" className="p-2 text-neutral-600 hover:text-sky-600 hover:bg-white rounded-md transition-colors"><AlignVerticalSpaceAround size={16} /></button>
              </div>

              {activeNode.shape !== 'isa' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Name</label>
                  <input 
                    type="text" value={activeNode.name} 
                    onChange={(e) => updateSelectedNode({ name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} 
                    onBlur={() => commitAction(nodes, edges)}
                    className="w-full bg-white/60 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm" 
                  />
                </div>
              )}

              {(activeNode.shape === 'rectangle' || activeNode.shape === 'diamond') && (
                <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-neutral-200/50 shadow-sm">
                  <input type="checkbox" checked={activeNode.isWeak} onChange={(e) => updateSelectedNode({ isWeak: e.target.checked }, true)} className="w-4 h-4 accent-sky-600 rounded cursor-pointer" id="weak-toggle" />
                  <label htmlFor="weak-toggle" className="text-sm font-medium text-neutral-700 cursor-pointer select-none flex-1">
                    {activeNode.shape === 'rectangle' ? 'Weak Entity (Double Border)' : 'Identifying Rel. (Double Border)'}
                  </label>
                </div>
              )}

              {/* TABLE COLORS */}
              {activeNode.shape === 'rectangle' && (
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><Palette size={12}/> Header Color</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-white/60 rounded-lg border border-neutral-200/50 shadow-sm">
                    {[
                      'bg-[#bae6fd]', 'bg-[#fecaca]', 'bg-[#bbf7d0]', 'bg-[#fef08a]', 'bg-[#e9d5ff]', 
                      'bg-[#f1f5f9]', 'bg-[#fed7aa]', 'bg-[#fbcfe8]', 'bg-[#d9f99d]', 'bg-[#99f6e4]'
                    ].map(color => (
                      <button 
                        key={color} onClick={() => updateSelectedNode({ color }, true)} 
                        className={`w-6 h-6 rounded-full border-2 ${activeNode.color === color ? 'border-neutral-800' : 'border-transparent'} ${color} hover:scale-110 transition-transform shadow-sm`} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TABLE ATTRIBUTES */}
              {activeNode.shape === 'rectangle' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Columns</label>
                    <button onClick={() => updateSelectedNode({ attributes: [...(activeNode.attributes || []), { id: `a_${Date.now()}`, name: 'new_col', type: 'VARCHAR(255)', isPK: false, isFK: false, isNullable: true, isPartialKey: false, indent: 0 }] }, true)} className="p-1.5 hover:bg-white bg-white/50 border border-neutral-200/50 shadow-sm rounded-md text-sky-600 transition-all"><Plus size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    {activeNode.attributes?.map(attr => (
                      <div key={attr.id} className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-2.5 rounded-lg shadow-sm space-y-2 group/attr transition-all hover:shadow-md">
                        <div className="flex items-center gap-1">
                           <button onClick={() => updateSelectedNode({ attributes: (activeNode.attributes || []).filter(a => a.id !== attr.id) }, true)} className="text-neutral-400 hover:text-red-500 p-1 bg-red-50/0 hover:bg-red-50 rounded" title="Delete Attribute"><X size={14} /></button>
                           
                           <div className="flex border border-neutral-200 rounded overflow-hidden mr-1">
                             <button onClick={() => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? {...a, indent: Math.max(0, (a.indent || 0) - 1)} : a) }, true)} disabled={(attr.indent || 0) <= 0} className="p-0.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 transition-colors" title="Outdent"><ChevronLeft size={14}/></button>
                             <button onClick={() => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? {...a, indent: Math.min(2, (a.indent || 0) + 1)} : a) }, true)} disabled={(attr.indent || 0) >= 2} className="p-0.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 border-l border-neutral-200 transition-colors" title="Indent (Make Child)"><ChevronRight size={14}/></button>
                           </div>

                           <input 
                              value={attr.name} onChange={(e) => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? { ...a, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') } : a) })} 
                              onBlur={() => commitAction(nodes, edges)}
                              className="w-24 min-w-0 border-none bg-neutral-100/50 rounded px-1.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all" 
                            />
                           <select value={attr.type} onChange={(e) => updateSelectedNode({ attributes: (activeNode.attributes || []).map(a => a.id === attr.id ? { ...a, type: e.target.value } : a) }, true)} className="flex-1 border border-neutral-200/80 bg-neutral-50/80 rounded px-1 py-1 text-[11px] font-mono text-neutral-600 focus:outline-none focus:border-sky-500 transition-colors">
                             {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pl-7">
                           <AttrToggle icon={<Key size={12}/>} label="PK" active={attr.isPK} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isPK: !a.isPK, isPartialKey: false } : a) }, true)} title="Primary Key" />
                           <AttrToggle icon={<Hash size={12}/>} label="Partial" active={attr.isPartialKey} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isPartialKey: !a.isPartialKey, isPK: false } : a) }, true)} title="Partial Key (Weak Entity Discriminator)" />
                           <AttrToggle icon={<span className="font-mono text-[11px] leading-none">{'{}'}</span>} label="Multi" active={attr.isMultivalued} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isMultivalued: !a.isMultivalued } : a) }, true)} title="Multivalued Attribute" />
                           <AttrToggle icon={<span className="font-mono text-[11px] leading-none">{'()'}</span>} label="Derived" active={attr.isDerived} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isDerived: !a.isDerived } : a) }, true)} title="Derived Attribute" />
                           <AttrToggle icon={<span className="font-mono text-[11px] leading-none">{'Ø'}</span>} label="Null" active={attr.isNullable} onClick={() => updateSelectedNode({ attributes: activeNode.attributes.map(a => a.id === attr.id ? { ...a, isNullable: !a.isNullable } : a) }, true)} title="Allow Null Values" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ISA (INHERITANCE) SETTINGS */}
              {activeNode.shape === 'isa' && (
                <div className="space-y-3 pt-2">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <Triangle size={14}/> Specialization (ISA)
                  </label>
                  <div className="bg-white/80 border border-sky-200/80 p-3 rounded-lg shadow-sm space-y-3">
                    <div className="text-xs font-semibold text-sky-800 mb-1">Select Superclass (Parent Entity):</div>
                    {edges.filter(e => e.source === activeNode.id || e.target === activeNode.id).map(edge => {
                      const connectedNode = nodes.find(n => n.id === (edge.source === activeNode.id ? edge.target : edge.source));
                      if (!connectedNode) return null;
                      return (
                        <label key={edge.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-sky-50 rounded transition-colors border border-transparent hover:border-sky-100">
                          <input type="radio" name={`isa-parent-${activeNode.id}`} checked={activeNode.parentId === connectedNode.id} onChange={() => updateSelectedNode({ parentId: connectedNode.id }, true)} className="accent-sky-600" />
                          <span className="text-sm font-medium text-neutral-700">{connectedNode.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                     <select value={activeNode.constraint || 'disjoint'} onChange={(e) => updateSelectedNode({ constraint: e.target.value }, true)} className="flex-1 border border-neutral-200 rounded-md text-xs px-2 py-2 bg-white shadow-sm focus:border-sky-500 focus:outline-none">
                       <option value="disjoint">Disjoint (d)</option><option value="overlapping">Overlapping (o)</option>
                     </select>
                     <select value={activeNode.completeness || 'partial'} onChange={(e) => updateSelectedNode({ completeness: e.target.value }, true)} className="flex-1 border border-neutral-200 rounded-md text-xs px-2 py-2 bg-white shadow-sm focus:border-sky-500 focus:outline-none">
                       <option value="partial">Partial</option><option value="total">Total</option>
                     </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EDGE PROPERTIES */}
          {activeEdge && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Edge Label / Constraint</label>
                  <input 
                    type="text" value={activeEdge.label || ''} 
                    onChange={(e) => updateEdgeProperties(activeEdge.id, { label: e.target.value })} 
                    onBlur={() => commitAction(nodes, edges)}
                    placeholder="e.g. 0..N, role_name"
                    className="w-full bg-white/60 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm" 
                  />
                </div>
                <div className="flex items-center gap-3 bg-white/80 p-3 rounded-lg border border-neutral-200/80 shadow-sm">
                  <input type="checkbox" checked={activeEdge.dashed} onChange={(e) => updateEdgeProperties(activeEdge.id, { dashed: e.target.checked }, true)} className="w-4 h-4 accent-sky-600 rounded cursor-pointer" id="dash-toggle" />
                  <label htmlFor="dash-toggle" className="text-sm font-medium text-neutral-700 cursor-pointer select-none flex-1">
                    Dashed Line (for attributes)
                  </label>
                </div>
             </div>
          )}
        </div>

        {/* RESTORED BOTTOM BUTTONS (Delete / Clear) */}
        <div className="p-4 border-t border-neutral-200/50 bg-white/50 space-y-2 shrink-0">
           <button onClick={deleteSelectedItem} disabled={!selectedItem} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-40 disabled:hover:bg-red-50 rounded-lg flex items-center justify-center gap-2 font-medium transition-all text-sm shadow-sm hover:shadow-md"><Trash2 size={16} /> Delete Selected</button>
           <button onClick={() => { if(window.confirm("Clear the entire canvas?")) { commitAction([], []); setSelectedItem(null); } }} className="w-full py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg flex items-center justify-center font-medium transition-all text-sm border border-neutral-200 shadow-sm hover:shadow-md">Clear Canvas</button>
        </div>
      </div>

      {/* SQL EXPORT MODAL */}
      {sqlModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
              <div className="flex items-center gap-2 font-bold text-neutral-800 text-lg"><Database size={22} className="text-sky-600" /> Compiled Schema</div>
              <button onClick={() => setSqlModalOpen(false)} className="text-neutral-400 hover:text-neutral-800 p-1 hover:bg-neutral-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            {/* Modal Controls */}
            <div className="flex items-center gap-4 bg-neutral-50 px-6 py-3 border-b border-neutral-200 text-sm">
               <select value={exportSettings.format} onChange={(e) => setExportSettings({...exportSettings, format: e.target.value})} className="border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium text-neutral-700 bg-white shadow-sm">
                  <option value="sql">SQL DDL Script</option>
                  <option value="schema">Relational Schema (Text)</option>
               </select>
               <select value={exportSettings.isaMethod} onChange={(e) => setExportSettings({...exportSettings, isaMethod: e.target.value})} className="border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium text-neutral-700 bg-white shadow-sm">
                  <option value="method1">ISA: Method 1 (Parent + Child Tables)</option>
                  <option value="method2">ISA: Method 2 (Push-down to Children)</option>
               </select>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#1e1e1e] text-neutral-200">
              {exportSettings.format === 'sql' 
                ? <code dangerouslySetInnerHTML={renderHighlightedSQL(buildSQLText(buildSchema(exportSettings.isaMethod)))} className="text-sm font-mono whitespace-pre-wrap selection:bg-sky-500/30 block" />
                : <code dangerouslySetInnerHTML={renderHighlightedSchema(buildRelationalText(buildSchema(exportSettings.isaMethod)))} className="text-sm font-mono whitespace-pre-wrap selection:bg-sky-500/30 block" />
              }
            </div>
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button onClick={() => setSqlModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors">Close</button>
              <button onClick={() => { 
                const text = exportSettings.format === 'sql' ? buildSQLText(buildSchema(exportSettings.isaMethod)) : buildRelationalText(buildSchema(exportSettings.isaMethod));
                navigator.clipboard.writeText(text); document.execCommand('copy'); 
              }} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40">Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

// Sub-component for auto-join ports
function Port({ position, setDragConnectStart, node }) {
  const classes = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    right: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    left: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2'
  };
  return (
    <div onPointerDown={(e) => { e.stopPropagation(); setDragConnectStart(node); }}
      className={`absolute w-3.5 h-3.5 bg-sky-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 hover:scale-150 transition-all duration-200 cursor-crosshair shadow-md z-30 ${classes[position]}`}
    />
  );
}

// Sub-component for Toolbar Buttons
function ToolButton({ icon, active, onClick, tooltip, disabled = false }) {
  return (
    <button disabled={disabled} onClick={onClick} title={tooltip} className={`relative p-3 rounded-xl transition-all duration-200 group shrink-0 ${disabled ? 'opacity-30 cursor-not-allowed' : active ? 'bg-sky-100 text-sky-700 shadow-inner ring-1 ring-sky-300' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 hover:shadow-sm'}`}>
      {icon}
      {!disabled && <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-neutral-800 text-white text-[11px] font-sans font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-all translate-x-1 group-hover:translate-x-0">{tooltip}</div>}
    </button>
  );
}

// Sub-component for Attribute Toggles
function AttrToggle({ icon, label, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${active ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300' : 'bg-neutral-100/50 text-neutral-500 hover:bg-neutral-200'}`}>
      {icon} {label}
    </button>
  );
}