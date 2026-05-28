# `.canvas` table-encoding convention (`dmv` extension)

## Background

[JSON Canvas v1.0](https://jsoncanvas.org/spec/1.0/) defines exactly four node types: `text`, `file`, `link`, `group`. It has no concept of a database table, column, primary key, foreign key, or cardinality. It is a generic infinite-canvas format.

This convention defines how datamodelviz represents a relational schema inside a `.canvas` file:

- **Visually**: each table is a `text` node whose Markdown content is a header + a column table.
- **Structurally**: each `text` node carries a custom `dmv` property holding the typed table data. The JSON Canvas spec [permits unknown keys](https://jsoncanvas.org/spec/1.0/) on nodes and edges; Obsidian Canvas and Hesprs's viewer both ignore them.
- **Relationships**: each foreign-key reference becomes a JSON Canvas `edge` between two table nodes, with the column info encoded in the edge label and in a `dmv` extension on the edge.

This keeps `.canvas` files **valid** for any generic JSON Canvas consumer (renders as plain text/Markdown nodes + edges) while allowing datamodelviz-aware tooling to round-trip structured data losslessly.

## Node convention

### Visual form (the `text` field)

```markdown
# users

| column | type | constraints |
|---|---|---|
| 🔑 **id** | integer | not null |
| email | varchar(255) | unique, not null |
| created_at | timestamp | default `now()` |
```

Rules:
- H1 is the table name.
- One Markdown table with three columns: name, type, constraints.
- 🔑 prefix on PK columns; 🔗 prefix on FK columns; both if the column is both.
- `constraints` is a comma-separated string (`not null`, `unique`, `default ...`, `check ...`).
- Backticks around SQL fragments (defaults, check expressions).

This is what Obsidian and Hesprs render. It is human-readable and works on **any** JSON Canvas viewer — that is the "fastest demo" we accepted.

### Structural form (the `dmv` extension)

Every `text` node that represents a table also carries this property:

```ts
type CanvasNodeDmv =
  | { kind: "table"; table: Table }
  | { kind: "note"; /* future: free-form notes */ };

interface Table {
  name: string;
  schema?: string;            // optional (e.g. "public")
  note?: string;              // table-level comment from DBML `Note:`
  columns: Column[];
  indexes?: Index[];          // optional, often omitted in v1
}

interface Column {
  name: string;
  type: string;               // raw type string, e.g. "varchar(255)", "integer"
  pk?: boolean;
  unique?: boolean;
  notNull?: boolean;
  default?: string;           // raw expression, e.g. "now()", "0"
  note?: string;              // column-level comment
}

interface Index {
  name?: string;
  columns: string[];
  unique?: boolean;
}
```

A table node therefore looks like:

```json
{
  "id": "users",
  "type": "text",
  "x": 0,
  "y": 0,
  "width": 360,
  "height": 220,
  "text": "# users\n\n| column | type | constraints |\n|---|---|---|\n| 🔑 **id** | integer | not null |\n| email | varchar(255) | unique, not null |\n",
  "dmv": {
    "kind": "table",
    "table": {
      "name": "users",
      "columns": [
        { "name": "id", "type": "integer", "pk": true, "notNull": true },
        { "name": "email", "type": "varchar(255)", "unique": true, "notNull": true }
      ]
    }
  }
}
```

The `id` field on the node MUST equal the table name (or `schema.tablename` if a schema is set). This is what edges reference.

## Edge convention

A DBML `Ref` like `Ref: posts.user_id > users.id` becomes one JSON Canvas edge:

```json
{
  "id": "posts.user_id->users.id",
  "fromNode": "posts",
  "toNode": "users",
  "fromSide": "right",
  "toSide": "left",
  "label": "user_id → id",
  "dmv": {
    "kind": "fk",
    "from": { "table": "posts", "column": "user_id" },
    "to":   { "table": "users", "column": "id" },
    "relation": "many-to-one"
  }
}
```

Rules:
- Edge `id` MUST be `<fromTable>.<fromColumn>-><toTable>.<toColumn>`. This makes diffing deterministic.
- `label` is `<fromColumn> → <toColumn>` for humans reading in Obsidian.
- `dmv.relation` is one of `one-to-one`, `one-to-many`, `many-to-one`, `many-to-many`. Derive from DBML's `-`, `<`, `>`, `<>` operators.
- `fromSide`/`toSide` defaults to `right`/`left` in v1 (grid layout). Future layout engines can recompute these.

## Round-trip behavior

| Consumer | `text` field | `dmv` extension |
|---|---|---|
| Obsidian Canvas | Renders Markdown ✓ | Preserved on save (Obsidian round-trips unknown keys) |
| Hesprs viewer | Renders Markdown ✓ | Ignored |
| datamodelviz CLI | Source of truth for visuals only | Source of truth for structure (used by `canvas-to-dbml`, Phase 2) |
| Generic JSON Canvas tools | Renders Markdown ✓ | Ignored |

**The `dmv` extension is the authoritative source of structural data.** If a user edits the Markdown in Obsidian, those edits are visual-only for Phase 1 — they will not flow back into DBML. (Editing structurally requires Phase 2's `canvas-to-dbml`, which parses the `dmv` extension, ignoring `text`.)

## Layout

Phase 1 uses a fixed grid:
- `cols = ceil(sqrt(N))` where N = number of tables.
- Each cell is 360 px wide, height auto-computed from row count (`32 + 24 * (columnCount + 1)`).
- Gutter: 80 px both axes.
- Tables placed in alphabetical order by name, row-major.

This is deliberately dumb. Real layout (dagre / ELK) is Phase 2.

## Complete example

A two-table schema with one FK:

```json
{
  "nodes": [
    {
      "id": "users",
      "type": "text",
      "x": 0, "y": 0, "width": 360, "height": 180,
      "text": "# users\n\n| column | type | constraints |\n|---|---|---|\n| 🔑 **id** | integer | not null |\n| email | varchar(255) | unique, not null |\n",
      "dmv": {
        "kind": "table",
        "table": {
          "name": "users",
          "columns": [
            { "name": "id", "type": "integer", "pk": true, "notNull": true },
            { "name": "email", "type": "varchar(255)", "unique": true, "notNull": true }
          ]
        }
      }
    },
    {
      "id": "posts",
      "type": "text",
      "x": 440, "y": 0, "width": 360, "height": 220,
      "text": "# posts\n\n| column | type | constraints |\n|---|---|---|\n| 🔑 **id** | integer | not null |\n| 🔗 user_id | integer | not null |\n| title | varchar(255) | not null |\n",
      "dmv": {
        "kind": "table",
        "table": {
          "name": "posts",
          "columns": [
            { "name": "id", "type": "integer", "pk": true, "notNull": true },
            { "name": "user_id", "type": "integer", "notNull": true },
            { "name": "title", "type": "varchar(255)", "notNull": true }
          ]
        }
      }
    }
  ],
  "edges": [
    {
      "id": "posts.user_id->users.id",
      "fromNode": "posts",
      "toNode": "users",
      "fromSide": "left",
      "toSide": "right",
      "label": "user_id → id",
      "dmv": {
        "kind": "fk",
        "from": { "table": "posts", "column": "user_id" },
        "to":   { "table": "users", "column": "id" },
        "relation": "many-to-one"
      }
    }
  ]
}
```

## Versioning

This document is version **0.1** of the convention. Breaking changes to the `dmv` extension shape bump the minor version. Add a `dmv.version` field to the canvas root object once Phase 2 lands (so `canvas-to-dbml` can reject incompatible files).
