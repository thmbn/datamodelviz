// JSON Canvas v1.0 spec types (https://jsoncanvas.org/spec/1.0/) + dmv extension.
// The dmv extension keys are ignored by Obsidian Canvas and Hesprs viewer but
// allow datamodelviz tooling to round-trip structured table data losslessly.

export type CanvasColor = string;
export type NodeSide = "top" | "right" | "bottom" | "left";
export type EdgeEnd = "none" | "arrow";

export interface CanvasNodeBase {
  id: string;
  type: "text" | "file" | "link" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
  dmv?: NodeDmv;
}

export interface TextNode extends CanvasNodeBase {
  type: "text";
  text: string;
}

export type CanvasNode = TextNode; // we only emit text nodes in v1

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: NodeSide;
  toSide?: NodeSide;
  fromEnd?: EdgeEnd;
  toEnd?: EdgeEnd;
  color?: CanvasColor;
  label?: string;
  dmv?: EdgeDmv;
}

export interface Canvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// --- dmv extension ----------------------------------------------------------

export type NodeDmv = { kind: "table"; table: Table };

export interface Table {
  name: string;
  schema?: string;
  note?: string;
  columns: Column[];
  indexes?: Index[];
}

export interface Column {
  name: string;
  type: string;
  pk?: boolean;
  unique?: boolean;
  notNull?: boolean;
  default?: string;
  note?: string;
}

export interface Index {
  name?: string;
  columns: string[];
  unique?: boolean;
}

export type Relation = "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";

export interface EdgeDmv {
  kind: "fk";
  from: { table: string; column: string };
  to: { table: string; column: string };
  relation: Relation;
}

// --- DBML AST normalized form (decoupled from @dbml/core internals) --------

export interface Ref {
  from: { table: string; column: string };
  to: { table: string; column: string };
  relation: Relation;
}

export interface Schema {
  tables: Table[];
  refs: Ref[];
}
