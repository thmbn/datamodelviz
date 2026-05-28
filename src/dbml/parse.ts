import pkg from "@dbml/core";
import type { Schema as Schema_, Table as Table_, Column, Relation, Ref } from "../canvas/types.js";

const { Parser } = pkg;

export function parseDbml(dbml: string): Schema_ {
  const database = Parser.parse(dbml, "dbmlv2");
  const tables: Table_[] = [];
  const refs: Ref[] = [];

  for (const schema of database.schemas) {
    for (const t of schema.tables) {
      tables.push(toTable(t));
    }
    for (const r of schema.refs) {
      const ref = toRef(r);
      if (ref) refs.push(ref);
    }
  }

  return { tables, refs };
}

function toTable(t: any): Table_ {
  const columns: Column[] = (t.fields ?? []).map((f: any) => {
    const col: Column = {
      name: f.name,
      type: typeToString(f.type),
    };
    if (f.pk) col.pk = true;
    if (f.unique) col.unique = true;
    if (f.not_null) col.notNull = true;
    if (f.dbdefault != null) col.default = defaultToString(f.dbdefault);
    if (f.note) col.note = String(f.note);
    return col;
  });

  // Composite PKs declared via `indexes { (col1, col2) [pk] }` — lift onto column metadata.
  for (const idx of t.indexes ?? []) {
    if (!idx.pk) continue;
    for (const ic of idx.columns ?? []) {
      const colName = ic.value;
      const col = columns.find((c) => c.name === colName);
      if (col) col.pk = true;
    }
  }

  const table: Table_ = {
    name: t.name,
    columns,
  };
  if (t.schema && t.schema.name && t.schema.name !== "public") table.schema = t.schema.name;
  if (t.note) table.note = String(t.note);
  return table;
}

function typeToString(type: any): string {
  if (!type) return "";
  if (typeof type === "string") return type;
  const name = type.type_name ?? type.name ?? "";
  const args = type.args ? `(${type.args})` : "";
  return `${name}${args}`;
}

function defaultToString(d: any): string {
  if (typeof d === "string") return d;
  if (d == null) return "";
  if (typeof d === "object" && "value" in d) return String(d.value);
  return String(d);
}

function toRef(r: any): Ref | null {
  const eps = r.endpoints ?? [];
  if (eps.length !== 2) return null;
  const [a, b] = eps;
  if (!a.fieldNames?.length || !b.fieldNames?.length) return null;

  // DBML relation operators on endpoints: '1' = one, '*' = many
  // We orient so that "from" is the many side (FK holder) when possible.
  let fromEp = a;
  let toEp = b;
  if (a.relation === "1" && b.relation === "*") {
    fromEp = b;
    toEp = a;
  }

  const relation = inferRelation(fromEp.relation, toEp.relation);

  return {
    from: { table: fromEp.tableName, column: fromEp.fieldNames[0] },
    to: { table: toEp.tableName, column: toEp.fieldNames[0] },
    relation,
  };
}

function inferRelation(from: string, to: string): Relation {
  // from is conventionally the many side after toRef() reorientation.
  if (from === "*" && to === "1") return "many-to-one";
  if (from === "1" && to === "*") return "one-to-many";
  if (from === "1" && to === "1") return "one-to-one";
  if (from === "*" && to === "*") return "many-to-many";
  return "many-to-one";
}
