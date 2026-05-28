import type { Table, Ref } from "./types.js";

export function renderTableMarkdown(table: Table, refs: Ref[]): string {
  const fkCols = new Set(refs.filter((r) => r.from.table === table.name).map((r) => r.from.column));

  const lines: string[] = [];
  lines.push(`# ${table.name}`);
  if (table.note) {
    lines.push("");
    lines.push(`_${table.note}_`);
  }
  lines.push("");
  lines.push("| column | type | constraints |");
  lines.push("|---|---|---|");

  for (const col of table.columns) {
    const prefix: string[] = [];
    if (col.pk) prefix.push("🔑");
    if (fkCols.has(col.name)) prefix.push("🔗");
    const namePart = col.pk
      ? `${prefix.join(" ")} **${col.name}**`
      : prefix.length > 0
        ? `${prefix.join(" ")} ${col.name}`
        : col.name;

    const constraints: string[] = [];
    if (col.notNull) constraints.push("not null");
    if (col.unique && !col.pk) constraints.push("unique");
    if (col.default) constraints.push(`default \`${col.default}\``);

    const type = col.type || "—";
    lines.push(`| ${namePart} | ${type} | ${constraints.join(", ") || ""} |`);
  }

  return lines.join("\n") + "\n";
}

export function estimateTableHeight(table: Table): number {
  // Heuristic: header (~80px) + Markdown table header row (~30) + per-column row (~28) + padding.
  const colRows = table.columns.length;
  const noteHeight = table.note ? 24 : 0;
  return 96 + noteHeight + 30 + colRows * 28 + 32;
}
