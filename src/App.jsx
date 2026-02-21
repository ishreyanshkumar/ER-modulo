import React, { useRef } from 'react';
import { useDiagramState } from './hooks/useDiagramState';
import { getBounds } from './utils/geometry';
import { toPng, toSvg } from 'html-to-image';
import BottomToolbar from './components/Toolbar/BottomToolbar';
import TopRibbon from './components/Ribbon/TopRibbon';
import Canvas from './components/Canvas/Canvas';
import MiniMap from './components/Canvas/MiniMap';
import SqlModal from './components/Modals/SqlModal';
import ImportModal from './components/Modals/ImportModal';
import SimulationConsole from './components/Modals/SimulationConsole';
import AICommandBar from './components/Modals/AICommandBar';
import HelpModal from './components/Modals/HelpModal';

export default function App() {
  const canvasRef = useRef(null);
  const ds = useDiagramState();
  const { 
    nodes, setNodes, edges, setEdges, selectedItem, setSelectedItem,
    pan, setPan, zoom, setZoom, mode, setMode, snapToGrid, setSnapToGrid,
    isDragging, setIsDragging, dragOffset, setDragOffset,
    mousePos, setMousePos, dragConnectStart, setDragConnectStart,
    sqlModalOpen, setSqlModalOpen, importModalOpen, setImportModalOpen,
    exportSettings, setExportSettings,
    commitAction, undo, redo, updateSelectedNode, updateEdgeProperties,
    deleteSelectedItem, handleDuplicate, alignNeighbors, createAggregation,
    clearCanvas, darkMode, setDarkMode, autoLayoutNodes,
    simulationOpen, setSimulationOpen,
    aiCommandOpen, setAiCommandOpen, apiKey, setApiKey,
    helpModalOpen, setHelpModalOpen
  } = ds;

  // --- INTERACTION HANDLERS (Re-implemented in App for context) ---
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

    if (['add-rect', 'add-dia', 'add-attr', 'add-isa', 'add-note'].includes(mode)) {
      const shapeMap = { 
        'add-rect': 'rectangle', 
        'add-dia': 'diamond', 
        'add-attr': 'attribute', 
        'add-isa': 'isa',
        'add-note': 'note'
      };
      const newNode = {
        id: `node_${Date.now()}`, shape: shapeMap[mode], name: shapeMap[mode] === 'isa' ? 'ISA' : shapeMap[mode] === 'note' ? 'New Note' : `new_${shapeMap[mode]}`, 
        x: rawX - 60, y: rawY - 30, isWeak: false, color: shapeMap[mode] === 'note' ? 'bg-amber-100' : 'bg-[#bae6fd]',
        attributes: shapeMap[mode] === 'rectangle' ? [{ id: `a_${Date.now()}`, name: 'id', type: 'INT', isPK: true, isFK: false, isNullable: false, indent: 0 }] : undefined,
        constraint: shapeMap[mode] === 'isa' ? 'disjoint' : undefined, completeness: shapeMap[mode] === 'isa' ? 'partial' : undefined
      };
      commitAction([...nodes, newNode], edges);
      setMode('select'); setSelectedItem({ type: 'node', id: newNode.id });
    } else if (mode === 'select') {
      setSelectedItem(null); setIsDragging(true);
    }
  };

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
          setNodes(data.nodes);
          setEdges(data.edges);
          setSelectedItem(null);
        }
      } catch { alert("Invalid workspace file"); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const exportImage = async (format) => {
    if (!canvasRef.current) return;
    try {
      const filter = (node) => !node.classList?.contains('port-handle'); // Exclude ports
      const options = { filter, backgroundColor: ds.darkMode ? '#0a0a0a' : '#f8fafc' };
      
      let dataUrl;
      if (format === 'png') dataUrl = await toPng(canvasRef.current, options);
      else dataUrl = await toSvg(canvasRef.current, options);
      
      const link = document.createElement('a');
      link.download = `er_diagram.${format}`;
      link.href = dataUrl;
      link.click();
    } catch { console.error('Export failed'); }
  };

  const handleAISubmit = async (prompt) => {
    if (!apiKey) return;
    
    const systemPrompt = `
      You are an expert Database Architect. Your task is to design an ER Diagram based on the user's description.
      You MUST return ONLY a JSON object with the following structure:
      {
        "nodes": [
          { 
            "id": "node_1", 
            "shape": "rectangle" (for entities) or "diamond" (for relationships), 
            "name": "EntityName", 
            "x": 100, "y": 100, 
            "attributes": [
              { "id": "a1", "name": "id", "type": "INT", "isPK": true, "isFK": false, "isNullable": false }
            ] 
          }
        ],
        "edges": [
          { "id": "e1", "source": "node_1", "target": "node_2", "cardinality": "1", "participation": "partial" }
        ]
      }
      
      Rules:
      1. Entities are "rectangle", use CamelCase for names.
      2. Relationships are "diamond".
      3. Always include an 'id' primary key for entities.
      4. If the user is refining an existing diagram, I will provide the current state below.
      5. Return ONLY valid JSON. No markdown formatting.
      
      Current Diagram State:
      ${JSON.stringify({ nodes, edges })}
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' for cheaper calls
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error.message);

      const content = result.choices[0].message.content;
      const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, ''));
      
      if (parsed.nodes && parsed.edges) {
        // Simple positioning or let auto-layout handle it
        commitAction(parsed.nodes, parsed.edges);
        setTimeout(() => autoLayoutNodes(), 100);
      }
    } catch (err) {
      console.error('AI Error:', err);
      alert('AI Generation failed: ' + err.message);
      throw err;
    }
  };

  React.useEffect(() => {
    const handleDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAiCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleDown);
    return () => window.removeEventListener('keydown', handleDown);
  }, [setAiCommandOpen]);

  return (
    <div className={`flex w-full h-screen ${darkMode ? 'bg-neutral-950 text-neutral-200' : 'bg-[#f1f5f9] text-neutral-800'} overflow-hidden font-sans selection:bg-sky-200 relative`}>
      <TopRibbon 
        selectedItem={selectedItem}
        nodes={nodes} edges={edges}
        updateSelectedNode={updateSelectedNode}
        updateEdgeProperties={updateEdgeProperties}
        deleteSelectedItem={deleteSelectedItem}
        handleDuplicate={handleDuplicate}
        alignNeighbors={alignNeighbors}
        createAggregation={createAggregation}
        commitAction={commitAction}
        clearCanvas={clearCanvas}
        undo={undo} redo={redo} pastCount={ds.past.length} futureCount={ds.future.length}
        setZoom={setZoom} handleSave={handleSave} handleLoad={handleLoad}
        setSqlModalOpen={setSqlModalOpen}
        setImportModalOpen={setImportModalOpen}
        simulationOpen={simulationOpen} setSimulationOpen={setSimulationOpen}
        aiCommandOpen={aiCommandOpen} setAiCommandOpen={setAiCommandOpen}
        helpModalOpen={helpModalOpen} setHelpModalOpen={setHelpModalOpen}
        darkMode={darkMode} setDarkMode={setDarkMode}
        handleExport={exportImage}
        autoLayoutNodes={autoLayoutNodes}
      />

      <Canvas 
        canvasRef={canvasRef}
        nodes={nodes} edges={edges} selectedItem={selectedItem}
        pan={pan} zoom={zoom} mode={mode} snapToGrid={snapToGrid}
        isDragging={isDragging} mousePos={mousePos} dragConnectStart={dragConnectStart}
        handleCanvasPointerDown={handleCanvasPointerDown}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
        handlePointerDown={handlePointerDown}
        handleNodePointerUp={handleNodePointerUp}
        setDragConnectStart={setDragConnectStart}
        updateSelectedNode={updateSelectedNode}
        darkMode={darkMode}
      />

      <MiniMap nodes={nodes} edges={edges} pan={pan} zoom={zoom} darkMode={darkMode} />

      <BottomToolbar mode={mode} setMode={setMode} darkMode={darkMode} />

      <SqlModal 
        nodes={nodes} edges={edges}
        sqlModalOpen={sqlModalOpen} setSqlModalOpen={setSqlModalOpen}
        exportSettings={exportSettings} setExportSettings={setExportSettings}
        darkMode={darkMode}
      />

      <ImportModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onImport={(n, e) => commitAction(n, e)}
        darkMode={darkMode}
      />

      <SimulationConsole 
        isOpen={simulationOpen} 
        onClose={() => setSimulationOpen(false)}
        nodes={nodes} edges={edges}
        darkMode={darkMode}
      />

      <AICommandBar 
        isOpen={aiCommandOpen}
        onClose={() => setAiCommandOpen(false)}
        onSubmit={handleAISubmit}
        apiKey={apiKey}
        setApiKey={setApiKey}
        darkMode={darkMode}
      />

      <HelpModal 
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        darkMode={darkMode}
      />
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}