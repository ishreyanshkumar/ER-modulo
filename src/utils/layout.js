import dagre from "dagre";

export const autoLayout = (nodes, edges) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    nodesep: 150,
    ranksep: 200,
    marginx: 100,
    marginy: 100,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    // Standard sizes for layout calculation
    let width = 160;
    let height = 100;

    if (node.shape === "diamond") {
      width = 120;
      height = 120;
    }
    if (node.shape === "attribute") {
      width = 100;
      height = 60;
    }
    if (node.shape === "isa") {
      width = 100;
      height = 100;
    }

    g.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeLayout = g.node(node.id);
    if (!nodeLayout) return node;

    return {
      ...node,
      x: Math.round(nodeLayout.x - nodeLayout.width / 2),
      y: Math.round(nodeLayout.y - nodeLayout.height / 2),
    };
  });
};
