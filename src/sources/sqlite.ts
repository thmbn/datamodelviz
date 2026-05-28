import Database from "better-sqlite3";

interface SqliteColumn {
  cid: number;
  name: string;
  type: string;
  notnull: 0 | 1;
  dflt_value: string | null;
  pk: number; // 0 if not PK, else position in PK (1-indexed)
}

interface SqliteForeignKey {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

interface SqliteIndex {
  seq: number;
  name: string;
  unique: 0 | 1;
  origin: string;
  partial: 0 | 1;
}

interface SqliteIndexColumn {
  seqno: number;
  cid: number;
  name: string | null;
}

export function sqliteToDbml(dbPath: string): string {
  const db = new Database(dbPath, { readonly: true });
  try {
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type='table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`
      )
      .all() as { name: string }[];

    const lines: string[] = [];

    for (const { name: tableName } of tables) {
      const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all() as SqliteColumn[];
      const fks = db.prepare(`PRAGMA foreign_key_list("${tableName}")`).all() as SqliteForeignKey[];
      const indexes = db.prepare(`PRAGMA index_list("${tableName}")`).all() as SqliteIndex[];

      lines.push(`Table ${quoteIdent(tableName)} {`);

      const fkByCol = new Map<string, SqliteForeignKey>();
      for (const fk of fks) fkByCol.set(fk.from, fk);

      // SQLite supports composite PKs via multiple rows with pk > 0
      const pkCols = columns.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk);
      const isCompositePk = pkCols.length > 1;

      for (const col of columns) {
        const constraints: string[] = [];
        if (!isCompositePk && col.pk > 0) constraints.push("pk");
        if (col.notnull) constraints.push("not null");
        if (col.dflt_value !== null) constraints.push(`default: \`${col.dflt_value}\``);

        // Note: FK refs in DBML are emitted as a separate Ref block below for clarity,
        // not inline, so this stays robust against composite FKs.

        const type = col.type || "blob"; // SQLite allows blank type (defaults to BLOB affinity)
        const constraintStr = constraints.length ? ` [${constraints.join(", ")}]` : "";
        lines.push(`  ${quoteIdent(col.name)} ${type}${constraintStr}`);
      }

      if (isCompositePk) {
        lines.push("");
        lines.push("  indexes {");
        lines.push(`    (${pkCols.map((c) => quoteIdent(c.name)).join(", ")}) [pk]`);
        lines.push("  }");
      }

      // Non-PK, non-autoindex indexes
      const userIndexes = indexes.filter(
        (idx) => idx.origin !== "pk" && !idx.name.startsWith("sqlite_autoindex_")
      );
      if (userIndexes.length > 0 && !isCompositePk) {
        lines.push("");
        lines.push("  indexes {");
        for (const idx of userIndexes) {
          const cols = db.prepare(`PRAGMA index_info("${idx.name}")`).all() as SqliteIndexColumn[];
          const colNames = cols.map((c) => quoteIdent(c.name || "")).join(", ");
          const flags = idx.unique ? " [unique]" : "";
          lines.push(`    (${colNames})${flags}`);
        }
        lines.push("  }");
      }

      lines.push("}");
      lines.push("");
    }

    // Emit refs separately so composite FKs and multi-column refs are clean.
    for (const { name: tableName } of tables) {
      const fks = db.prepare(`PRAGMA foreign_key_list("${tableName}")`).all() as SqliteForeignKey[];
      // Group by `id` (each FK constraint has same id, one row per column)
      const fksById = new Map<number, SqliteForeignKey[]>();
      for (const fk of fks) {
        const arr = fksById.get(fk.id) ?? [];
        arr.push(fk);
        fksById.set(fk.id, arr);
      }
      for (const group of fksById.values()) {
        group.sort((a, b) => a.seq - b.seq);
        const targetTable = group[0].table;
        if (group.length === 1) {
          const fk = group[0];
          lines.push(
            `Ref: ${quoteIdent(tableName)}.${quoteIdent(fk.from)} > ${quoteIdent(targetTable)}.${quoteIdent(fk.to)}`
          );
        } else {
          const fromCols = group.map((g) => quoteIdent(g.from)).join(", ");
          const toCols = group.map((g) => quoteIdent(g.to)).join(", ");
          lines.push(
            `Ref: ${quoteIdent(tableName)}.(${fromCols}) > ${quoteIdent(targetTable)}.(${toCols})`
          );
        }
      }
    }

    return lines.join("\n").replace(/\n+$/, "") + "\n";
  } finally {
    db.close();
  }
}

function quoteIdent(name: string): string {
  // DBML allows bare identifiers for simple names; quote anything with non-word chars.
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `"${name}"`;
}
