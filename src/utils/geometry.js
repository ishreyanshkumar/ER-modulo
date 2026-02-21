export const getBounds = (node, allNodes, allEdges) => {
  if (node.shape === "aggregation") {
    const rel = allNodes.find((n) => n.id === node.relId);
    if (!rel)
      return {
        x: node.x,
        y: node.y,
        w: 100,
        h: 100,
        cx: node.x + 50,
        cy: node.y + 50,
      };

    let minX = rel.x,
      minY = rel.y;
    let maxX = rel.x + 140,
      maxY = rel.y + 70; // Default diamond size

    allEdges
      .filter((e) => e.source === rel.id || e.target === rel.id)
      .forEach((e) => {
        const otherId = e.source === rel.id ? e.target : e.source;
        const otherNode = allNodes.find((x) => x.id === otherId);
        if (otherNode && otherNode.shape !== "attribute") {
          const w = otherNode.shape === "rectangle" ? 180 : 100;
          const h =
            otherNode.shape === "rectangle"
              ? 32 + (otherNode.attributes?.length || 0) * 26 + 8
              : 100;
          minX = Math.min(minX, otherNode.x);
          minY = Math.min(minY, otherNode.y);
          maxX = Math.max(maxX, otherNode.x + w);
          maxY = Math.max(maxY, otherNode.y + h);
        }
      });
    const pad = 24;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    return {
      x: minX - pad,
      y: minY - pad,
      w,
      h,
      cx: minX - pad + w / 2,
      cy: minY - pad + h / 2,
    };
  }

  let w = 100,
    h = 100;
  if (node.shape === "diamond") {
    w = 140;
    h = 70;
  } else if (node.shape === "isa") {
    w = 80;
    h = 70;
  } else if (node.shape === "attribute") {
    w = 90;
    h = 36;
  } else if (node.shape === "rectangle") {
    w = 180;
    h = 32 + (node.attributes?.length || 0) * 26 + 8;
  }

  return { x: node.x, y: node.y, w, h, cx: node.x + w / 2, cy: node.y + h / 2 };
};

export const getEdgeIntersection = (
  sourceNode,
  targetPt,
  allNodes,
  allEdges,
) => {
  const bounds = getBounds(sourceNode, allNodes, allEdges);
  const cx = bounds.cx;
  const cy = bounds.cy;

  const tx = targetPt.cx !== undefined ? targetPt.cx : targetPt.x;
  const ty = targetPt.cy !== undefined ? targetPt.cy : targetPt.y;

  const dx = tx - cx;
  const dy = ty - cy;

  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  if (sourceNode.shape === "isa") {
    const r = 35;
    const dist = Math.hypot(dx, dy);
    return { x: cx + (dx * r) / dist, y: cy + (dy * r) / dist };
  } else if (sourceNode.shape === "diamond") {
    const scale =
      1 / (Math.abs(dx) / (bounds.w / 2) + Math.abs(dy) / (bounds.h / 2));
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
