import type { Table } from "./types.js";
import { estimateTableHeight } from "./markdown.js";

export interface Placement {
  table: Table;
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_WIDTH = 360;
const GUTTER = 80;

export function gridLayout(tables: Table[]): Placement[] {
  const sorted = [...tables].sort((a, b) => a.name.localeCompare(b.name));
  const cols = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));

  // Track the bottom of each column so we can pack short tables tighter.
  const colBottoms = new Array<number>(cols).fill(0);
  const placements: Placement[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const table = sorted[i];
    const col = i % cols;
    const height = estimateTableHeight(table);
    const x = col * (NODE_WIDTH + GUTTER);
    const y = colBottoms[col];
    placements.push({ table, x, y, width: NODE_WIDTH, height });
    colBottoms[col] = y + height + GUTTER;
  }

  return placements;
}
