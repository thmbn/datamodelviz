---
name: visualize-data-model
description: Use this skill when the user wants to visualize a relational data model — generate an ER diagram, see a database schema laid out, or convert a database/DBML file into a viewable artifact. Triggers include phrasing like "visualize my schema", "generate an ERD", "show me the data model", "make a diagram of this database", "what does this database look like", "open this schema in Obsidian"; or when the user references a `.sqlite`, `.db`, `.sqlite3`, or `.dbml` file alongside any visualization request. This skill runs the `dmv` CLI (from the datamodelviz project) to produce a `.canvas` file (viewable in Obsidian or Hesprs's JSON Canvas Viewer) plus a `.dbml` text representation that Claude can reason over. Do NOT use this skill for non-relational data (NoSQL document stores, graph databases, key-value stores) or for visualizing application architecture rather than database tables.
---

# Visualize data model with `dmv`

This skill produces a JSON Canvas (`.canvas`) visualization of a relational data model using the `dmv` CLI from [datamodelviz](https://github.com/thmbn/datamodelviz). The output is openable in Obsidian Canvas natively, or in any JSON Canvas 1.0 viewer.

## When invoked

Identify the source the user has:

1. **A SQLite database file** (`.sqlite`, `.db`, `.sqlite3`) → use `dmv sqlite-to-canvas`
2. **A DBML file** (`.dbml`, [reference](https://dbml.dbdiagram.io)) → use `dmv dbml-to-canvas`
3. **No source yet** — ask whether they want to point at an existing database/DBML or brainstorm a fresh schema. If brainstorming: author a `.dbml` file with them first (DBML is compact, human-readable, and easy for both Claude and humans to edit), then run `dmv dbml-to-canvas` on it.

## Steps

### 1. Verify `dmv` is available

Run `which dmv` or `dmv --version`. If not found:

- If working inside the `datamodelviz` repo itself: use `npm run dmv -- <subcommand>` (the project ships an `npm` script that runs the CLI via `tsx`).
- Otherwise tell the user:
  > `dmv` isn't installed. To install: clone https://github.com/thmbn/datamodelviz, then `cd datamodelviz && npm install && npm link`. (npm publication is planned but not yet shipped.)

### 2. Run the converter

```bash
# SQLite source (writes <basename>.canvas next to the input)
dmv sqlite-to-canvas path/to/db.sqlite

# DBML source
dmv dbml-to-canvas path/to/schema.dbml

# Also useful: get the DBML text representation for review/editing
dmv sqlite-to-dbml path/to/db.sqlite -o path/to/db.dbml
```

Pass `-o <path>` if you want the output somewhere specific.

### 3. Report results

Tell the user where the files were written (use absolute paths) and what to do with them:

> Open the `.canvas` in Obsidian by copying it into any vault folder and clicking it. For a web view, load it in [Hesprs's JSON Canvas Viewer](https://github.com/Hesprs/JSON-Canvas-Viewer). The accompanying `.dbml` is the canonical text representation — hand-edit it and re-run `dmv dbml-to-canvas` to regenerate the visual.

## Notes for Claude

- **`.dbml` is the source of truth.** `.canvas` is a regenerable artifact. If the user asks for changes (add a table, add an FK, rename a column), edit the `.dbml` and re-convert — don't try to hand-edit the `.canvas` JSON.
- **The grid layout gets cluttered past ~15 tables.** Warn the user; layout improvements (dagre routing) are on the roadmap but not in v1.
- **Postgres, DuckDB, and Cosmos DB sources are NOT supported in v1.** Only SQLite end-to-end and DBML-input are wired up. If the user has a Postgres database, the workaround is `pg_dump --schema-only > schema.sql` → run through `sql2dbml --postgres` (from the [`@dbml/cli`](https://github.com/holistics/dbml) package) → then `dmv dbml-to-canvas`.

## What this skill replaces

Without this skill, Claude is likely to do one of these less useful things when asked to visualize a schema:

- Write a one-off Python script with `sqlite3` + `graphviz` to dump a PNG (works but is not editable and not Obsidian-native).
- Hand-author a Mermaid `erDiagram` block (renders in GitHub but doesn't compose into a vault).
- Hallucinate the schema from filenames or memory instead of introspecting the actual database.

`dmv` reads the real schema, writes a real `.canvas`, and the output round-trips through Obsidian and any JSON Canvas viewer.
