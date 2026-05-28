// Lightweight validator for generated .canvas files. Checks JSON Canvas v1.0
// conformance + that our dmv extension survived round-trip. Exits non-zero on failure.
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/validate.js <file.canvas>");
  process.exit(2);
}

const raw = readFileSync(path, "utf8");
let canvas;
try {
  canvas = JSON.parse(raw);
} catch (e) {
  fail(`not valid JSON: ${e.message}`);
}

if (!canvas || typeof canvas !== "object") fail("root is not an object");
if (!Array.isArray(canvas.nodes)) fail("nodes is not an array");
if (!Array.isArray(canvas.edges)) fail("edges is not an array");

const validNodeTypes = new Set(["text", "file", "link", "group"]);
const nodeIds = new Set();
let tablesWithDmv = 0;

for (const [i, n] of canvas.nodes.entries()) {
  if (typeof n.id !== "string") fail(`node[${i}] missing id`);
  if (nodeIds.has(n.id)) fail(`node[${i}] duplicate id ${n.id}`);
  nodeIds.add(n.id);
  if (!validNodeTypes.has(n.type)) fail(`node[${i}] type ${n.type} not in spec`);
  for (const k of ["x", "y", "width", "height"]) {
    if (typeof n[k] !== "number") fail(`node[${i}] ${k} not a number`);
  }
  if (n.type === "text" && typeof n.text !== "string") fail(`node[${i}] text node missing text`);
  if (n.dmv && n.dmv.kind === "table") {
    if (!n.dmv.table || typeof n.dmv.table.name !== "string") fail(`node[${i}] dmv.table.name missing`);
    if (!Array.isArray(n.dmv.table.columns)) fail(`node[${i}] dmv.table.columns not an array`);
    tablesWithDmv++;
  }
}

let edgesWithDmv = 0;
const edgeIds = new Set();
for (const [i, e] of canvas.edges.entries()) {
  if (typeof e.id !== "string") fail(`edge[${i}] missing id`);
  if (edgeIds.has(e.id)) fail(`edge[${i}] duplicate id ${e.id}`);
  edgeIds.add(e.id);
  if (!nodeIds.has(e.fromNode)) fail(`edge[${i}] fromNode ${e.fromNode} not found`);
  if (!nodeIds.has(e.toNode)) fail(`edge[${i}] toNode ${e.toNode} not found`);
  if (e.dmv && e.dmv.kind === "fk") {
    if (!e.dmv.from?.table || !e.dmv.from?.column) fail(`edge[${i}] dmv.from incomplete`);
    if (!e.dmv.to?.table || !e.dmv.to?.column) fail(`edge[${i}] dmv.to incomplete`);
    edgesWithDmv++;
  }
}

console.log(
  `OK  ${path}: ${canvas.nodes.length} nodes (${tablesWithDmv} tables w/ dmv), ${canvas.edges.length} edges (${edgesWithDmv} FKs w/ dmv)`
);

function fail(msg) {
  console.error(`FAIL ${path}: ${msg}`);
  process.exit(1);
}
