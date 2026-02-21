import { useState, useRef, useCallback, useEffect } from "react";
import { autoLayout } from "../utils/layout";

export const DATA_TYPES = [
  "INT",
  "VARCHAR(255)",
  "TEXT",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "DECIMAL(10,2)",
];

export const initialNodes = [
  {
    id: "n1",
    shape: "rectangle",
    name: "instructor",
    x: 100,
    y: 150,
    isWeak: false,
    color: "bg-[#bae6fd]",
    attributes: [
      {
        id: "a1",
        name: "ID",
        type: "INT",
        isPK: true,
        isFK: false,
        isNullable: false,
        isPartialKey: false,
        indent: 0,
      },
      { id: "a2", name: "name", type: "VARCHAR(255)", indent: 0 },
    ],
  },
  {
    id: "n2",
    shape: "diamond",
    name: "proj_guide",
    x: 400,
    y: 150,
    isWeak: false,
  },
  {
    id: "n3",
    shape: "rectangle",
    name: "student",
    x: 700,
    y: 150,
    isWeak: false,
    color: "bg-[#bae6fd]",
    attributes: [
      { id: "a3", name: "s_id", type: "INT", isPK: true, indent: 0 },
    ],
  },
  {
    id: "agg1",
    shape: "aggregation",
    name: "project_team",
    relId: "n2",
    x: 0,
    y: 0,
  },
  {
    id: "n4",
    shape: "diamond",
    name: "eval_for",
    x: 400,
    y: 350,
    isWeak: false,
  },
  {
    id: "n5",
    shape: "rectangle",
    name: "evaluation",
    x: 400,
    y: 500,
    isWeak: false,
    color: "bg-[#bae6fd]",
    attributes: [
      { id: "a4", name: "eval_id", type: "INT", isPK: true, indent: 0 },
      { id: "a5", name: "score", type: "INT", indent: 0 },
    ],
  },
];

export const initialEdges = [
  {
    id: "e1",
    source: "n2",
    target: "n1",
    cardinality: "N",
    participation: "partial",
    label: "guides",
  },
  {
    id: "e2",
    source: "n2",
    target: "n3",
    cardinality: "M",
    participation: "total",
    label: "works_on",
  },
  {
    id: "e3",
    source: "n4",
    target: "agg1",
    cardinality: "1",
    participation: "partial",
  },
  {
    id: "e4",
    source: "n4",
    target: "n5",
    cardinality: "N",
    participation: "total",
  },
];

export function useDiagramState() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // History State
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const lastSavedState = useRef({ nodes: initialNodes, edges: initialEdges });

  // Viewport
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState("select");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // Interaction State
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragConnectStart, setDragConnectStart] = useState(null);

  // Compiler State
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [aiCommandOpen, setAiCommandOpen] = useState(false);
  const [apiKey, _setApiKey] = useState(
    () => localStorage.getItem("er_diagrammer_api_key") || "",
  );

  const setApiKey = (key) => {
    localStorage.setItem("er_diagrammer_api_key", key);
    _setApiKey(key);
  };

  const [exportSettings, setExportSettings] = useState({
    format: "sql",
    isaMethod: "method1",
    dialect: "postgresql",
  });

  const commitAction = useCallback((newNodes, newEdges) => {
    if (
      JSON.stringify(lastSavedState.current.nodes) ===
        JSON.stringify(newNodes) &&
      JSON.stringify(lastSavedState.current.edges) === JSON.stringify(newEdges)
    )
      return;
    setPast((prev) => [...prev, lastSavedState.current]);
    setFuture([]);
    lastSavedState.current = { nodes: newNodes, edges: newEdges };
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((prev) => [lastSavedState.current, ...prev]);
    lastSavedState.current = previous;
    setPast(past.slice(0, past.length - 1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedItem(null);
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast((prev) => [...prev, lastSavedState.current]);
    lastSavedState.current = next;
    setFuture(future.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedItem(null);
  }, [future]);

  const updateSelectedNode = useCallback(
    (updates, commit = false) => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((n) =>
          n.id === selectedItem?.id ? { ...n, ...updates } : n,
        );
        if (commit) commitAction(newNodes, edges);
        return newNodes;
      });
    },
    [selectedItem, edges, commitAction],
  );

  const updateEdgeProperties = useCallback(
    (edgeId, updates, commit = false) => {
      setEdges((prevEdges) => {
        const newEdges = prevEdges.map((e) =>
          e.id === edgeId ? { ...e, ...updates } : e,
        );
        if (commit) commitAction(nodes, newEdges);
        return newEdges;
      });
    },
    [nodes, commitAction],
  );

  const deleteSelectedItem = useCallback(() => {
    if (!selectedItem) return;
    let newNodes = nodes;
    let newEdges = edges;
    if (selectedItem.type === "node") {
      newNodes = nodes.filter(
        (n) => n.id !== selectedItem.id && n.relId !== selectedItem.id,
      );
      newEdges = edges.filter(
        (e) => e.source !== selectedItem.id && e.target !== selectedItem.id,
      );
    } else {
      newEdges = edges.filter((e) => e.id !== selectedItem.id);
    }
    commitAction(newNodes, newEdges);
    setSelectedItem(null);
  }, [selectedItem, nodes, edges, commitAction]);

  const handleDuplicate = useCallback(() => {
    const activeNode = nodes.find((n) => n.id === selectedItem?.id);
    if (!activeNode) return;
    const newNode = {
      ...activeNode,
      id: `node_${Date.now()}`,
      x: activeNode.x + 40,
      y: activeNode.y + 40,
    };
    if (newNode.attributes)
      newNode.attributes = newNode.attributes.map((a) => ({
        ...a,
        id: `a_${Date.now()}_${Math.random()}`,
      }));
    commitAction([...nodes, newNode], edges);
    setSelectedItem({ type: "node", id: newNode.id });
  }, [selectedItem, nodes, edges, commitAction]);

  const alignNeighbors = useCallback(
    (axis) => {
      const activeNode = nodes.find((n) => n.id === selectedItem?.id);
      if (!activeNode) return;
      const connectedIds = new Set();
      edges.forEach((e) => {
        if (e.source === activeNode.id) connectedIds.add(e.target);
        if (e.target === activeNode.id) connectedIds.add(e.source);
      });
      commitAction(
        nodes.map((n) =>
          connectedIds.has(n.id) ? { ...n, [axis]: activeNode[axis] } : n,
        ),
        edges,
      );
    },
    [selectedItem, nodes, edges, commitAction],
  );

  const createAggregation = useCallback(() => {
    if (selectedItem?.type !== "node") return;
    const activeNode = nodes.find((n) => n.id === selectedItem.id);
    if (activeNode.shape !== "diamond") return;
    const newAgg = {
      id: `agg_${Date.now()}`,
      shape: "aggregation",
      relId: activeNode.id,
      name: `agg_${activeNode.name}`,
      x: 0,
      y: 0,
    };
    commitAction([...nodes, newAgg], edges);
  }, [selectedItem, nodes, edges, commitAction]);

  const clearCanvas = useCallback(() => {
    if (window.confirm("Clear the entire canvas?")) {
      commitAction([], []);
      setSelectedItem(null);
    }
  }, [commitAction]);

  const autoLayoutNodes = useCallback(() => {
    const newNodes = autoLayout(nodes, edges);
    commitAction(newNodes, edges);
  }, [nodes, edges, commitAction]);

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedItem,
    setSelectedItem,
    past,
    future,
    pan,
    setPan,
    zoom,
    setZoom,
    mode,
    setMode,
    snapToGrid,
    setSnapToGrid,
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset,
    mousePos,
    setMousePos,
    dragConnectStart,
    setDragConnectStart,
    darkMode,
    setDarkMode,
    sqlModalOpen,
    setSqlModalOpen,
    importModalOpen,
    setImportModalOpen,
    simulationOpen,
    setSimulationOpen,
    helpModalOpen,
    setHelpModalOpen,
    aiCommandOpen,
    setAiCommandOpen,
    apiKey,
    setApiKey,
    exportSettings,
    setExportSettings,
    commitAction,
    undo,
    redo,
    updateSelectedNode,
    updateEdgeProperties,
    deleteSelectedItem,
    handleDuplicate,
    alignNeighbors,
    createAggregation,
    clearCanvas,
    autoLayoutNodes,
  };
}
