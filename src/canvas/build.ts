import type { Canvas, CanvasEdge, TextNode, Schema, Ref, NodeSide } from "./types.js";
import { renderTableMarkdown } from "./markdown.js";
import { gridLayout, type Placement } from "./layout.js";

export function buildCanvas(schema: Schema): Canvas {
  const placements = gridLayout(schema.tables);
  const placementByName = new Map<string, Placement>();
  for (const p of placements) placementByName.set(p.table.name, p);

  const nodes: TextNode[] = placements.map((p) => ({
    id: p.table.name,
    type: "text",
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    text: renderTableMarkdown(p.table, schema.refs),
    dmv: { kind: "table", table: p.table },
  }));

  const edges: CanvasEdge[] = schema.refs
    .filter((r) => placementByName.has(r.from.table) && placementByName.has(r.to.table))
    .map((r) => edgeFromRef(r, placementByName));

  return { nodes, edges };
}

function edgeFromRef(ref: Ref, placementByName: Map<string, Placement>): CanvasEdge {
  const fromP = placementByName.get(ref.from.table)!;
  const toP = placementByName.get(ref.to.table)!;
  const { fromSide, toSide } = pickSides(fromP, toP);

  return {
    id: `${ref.from.table}.${ref.from.column}->${ref.to.table}.${ref.to.column}`,
    fromNode: ref.from.table,
    toNode: ref.to.table,
    fromSide,
    toSide,
    label: `${ref.from.column} → ${ref.to.column}`,
    dmv: {
      kind: "fk",
      from: ref.from,
      to: ref.to,
      relation: ref.relation,
    },
  };
}

function pickSides(a: Placement, b: Placement): { fromSide: NodeSide; toSide: NodeSide } {
  // Naive: compare centers. Prefer horizontal connections when possible.
  const aCx = a.x + a.width / 2;
  const aCy = a.y + a.height / 2;
  const bCx = b.x + b.width / 2;
  const bCy = b.y + b.height / 2;

  const dx = bCx - aCx;
  const dy = bCy - aCy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { fromSide: "right", toSide: "left" } : { fromSide: "left", toSide: "right" };
  } else {
    return dy >= 0 ? { fromSide: "bottom", toSide: "top" } : { fromSide: "top", toSide: "bottom" };
  }
}
