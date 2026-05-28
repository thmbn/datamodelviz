# datamodelviz — design doc (Phase 1: "fastest demo")

## 1. Goals

1. **Author from Claude Code.** A user describes a data model in a Claude Code session; Claude writes it as a `.dbml` file in the workspace AND as a `.canvas` file. The `.canvas` opens natively in Obsidian Canvas and renders in [Hesprs/JSON-Canvas-Viewer](https://github.com/Hesprs/JSON-Canvas-Viewer).
2. **Reverse from an existing database.** Given a connection to SQLite, PostgreSQL, DuckDB, or Cosmos DB, produce a `.dbml` (compact text Claude can reason over) and a `.canvas` (visual artifact for Obsidian / web viewer).
3. **Future (not Phase 1):** if a brainstormed ERD is worth pursuing, support `.dbml` → DDL → load into a fresh SQLite or Postgres database.

## 2. Non-goals (Phase 1)

These are deliberately excluded. **Do not implement them in Phase 1.**

- A bespoke web viewer with ERD-styled table boxes, routed FK lines, etc. Hesprs's viewer renders Markdown inside text nodes; that is the demo. ERD-aware rendering is Phase 3.
- A GUI editor. Editing happens in DBML text or in Obsidian Canvas natively.
- Cosmos DB support. Documented as future; see `README.md#azure-cosmos-db` for why it doesn't type-check as a question.
- Migrations / DDL emission to target databases. Phase 2.
- Real-time DB watching, live reload, auth flows.
- Custom layout algorithms beyond a simple grid. Dagre integration is a Phase 2 upgrade.

## 3. Architecture

Single pipeline, two entry points:

```
                    ┌──────────────────────┐
                    │  Claude Code session │
                    │  (user brainstorm)   │
                    └─────────┬────────────┘
                              │ writes
                              ▼
[Postgres] ┐                 ┌──────────┐                 ┌──────────┐
[SQLite]   ├── introspect ──▶│ .dbml    │── convert ─────▶│ .canvas  │
[DuckDB]   ┘                 │ (canon.) │                 │ (visual) │
                             └────┬─────┘                 └────┬─────┘
                                  │                            │
                                  ▼                            ▼
                          Claude reasons              Obsidian Canvas
                          over text DBML              + Hesprs viewer
```

- **DBML is the canonical intermediate representation.** Every source path produces DBML first; every output path consumes DBML.
- **`.canvas` is a derived artifact**, always regenerable from `.dbml`. Treat it as build output, not source-of-truth.
- The `dmv` extension keys on canvas nodes (see [canvas-convention.md](canvas-convention.md)) let tooling round-trip structured table data through `.canvas` without breaking Obsidian or Hesprs's viewer.

## 4. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript / Node 20+ | DBML's official SDK (`@dbml/core`) is JS; Hesprs viewer is TS; future web viewer wants the same toolchain |
| Package manager | pnpm | Speed; matches Hesprs viewer |
| DBML parsing | [`@dbml/core`](https://www.npmjs.com/package/@dbml/core) | Official, gives a typed AST |
| Postgres → DBML | [`@dbml/connector`](https://www.npmjs.com/package/@dbml/connector) | Official, handles auth + schemas |
| SQLite introspection | `better-sqlite3` + custom code | `sqlite_master` + `PRAGMA foreign_key_list`; ~80 lines |
| DuckDB introspection | `@duckdb/node-api` + custom code | Query `information_schema.tables` / `columns`; FKs via `information_schema.referential_constraints` (often empty — that's fine) |
| CLI framework | [`cac`](https://www.npmjs.com/package/cac) | Tiny, no decorator magic |
| Testing | `vitest` | Snapshot-friendly for `.canvas` fixtures |
| Layout | hand-rolled grid for v1 | Avoid pulling in dagre/ELK until we have real schemas to test against |

## 5. CLI surface

Single binary `dmv` (datamodelviz). Subcommands:

```
dmv dbml-to-canvas <input.dbml> [-o <output.canvas>]
dmv pg-to-canvas <conn-string> [-o <output.canvas>] [--schemas public,...]
dmv sqlite-to-canvas <file.sqlite> [-o <output.canvas>]
dmv duckdb-to-canvas <file.duckdb> [-o <output.canvas>]

# Lower-level (also exposed for composition):
dmv pg-to-dbml <conn-string> [-o <output.dbml>]
dmv sqlite-to-dbml <file.sqlite> [-o <output.dbml>]
dmv duckdb-to-dbml <file.duckdb> [-o <output.dbml>]
```

Defaults: if `-o` is omitted, write next to the input with the appropriate extension. For the `pg-to-*` form, default output is `./schema.canvas` (or `.dbml`).

Exit codes: 0 success, 1 user error (bad input/connection), 2 internal error.

## 6. Repo layout

```
datamodelviz/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── spec/
│   ├── design.md                ← this file
│   └── canvas-convention.md     ← .canvas table encoding spec
├── src/
│   ├── cli.ts                   ← cac entry point, dispatches subcommands
│   ├── dbml/
│   │   ├── parse.ts             ← thin wrapper around @dbml/core
│   │   └── types.ts             ← internal Table/Column/Ref types (decoupled from @dbml internals)
│   ├── sources/
│   │   ├── postgres.ts          ← @dbml/connector wrapper, returns DBML string
│   │   ├── sqlite.ts            ← custom introspection → DBML string
│   │   └── duckdb.ts            ← custom introspection → DBML string
│   ├── canvas/
│   │   ├── types.ts             ← JSON Canvas v1.0 types + dmv extension types
│   │   ├── build.ts             ← DBML AST → .canvas JSON
│   │   ├── markdown.ts          ← render a Table as Markdown for the text node
│   │   └── layout.ts            ← grid placement of nodes
│   └── index.ts                 ← library exports (for programmatic use)
├── examples/
│   ├── blog.dbml                ← hand-authored fixture (3 tables, 2 FKs)
│   ├── blog.canvas              ← expected output (committed for snapshot diffing)
│   └── chinook.sqlite           ← classic sample DB for integration test
└── test/
    ├── dbml-to-canvas.test.ts
    ├── sqlite-to-dbml.test.ts
    └── canvas-roundtrip.test.ts ← parse generated .canvas, assert dmv extension survives
```

## 7. Phase plan

**Phase 1 — fastest demo (this spec).**
Ships: DBML↔canvas converter; Postgres/SQLite/DuckDB → canvas; example fixtures; README quickstart. Visual verification: open `examples/blog.canvas` in Obsidian and in Hesprs's viewer.

**Phase 2 — round-trip + better viz.**
Ships: `dmv canvas-to-dbml` (parse `.canvas` back to DBML using the `dmv` extension); `dmv dbml-to-ddl --target postgres|sqlite` + `--apply` for loading; dagre layout option.

**Phase 3 — first-class web viewer.**
Ships: a React app on `xyflow` that consumes `.canvas` with the `dmv` extension and renders tables as ERD boxes with column rows and routed FK endpoints. Static site, deployable to GitHub Pages. Falls back to plain Markdown rendering when `dmv` is absent (so it works on any `.canvas` file, not just ours).

**Phase 4 — Cosmos + NoSQL.**
Ships: document sampling → inferred schema → DBML (lossy by design). Documents-as-tables convention.

## 8. Acceptance criteria for Phase 1

A change is done when **all** of:

1. `pnpm test` passes; snapshot tests for `examples/blog.dbml → examples/blog.canvas` round-trip cleanly.
2. `pnpm dmv dbml-to-canvas examples/blog.dbml` writes a `.canvas` that opens in Obsidian Canvas without errors and shows three text-node tables connected by two edges.
3. The same file loads in Hesprs's viewer (use the standalone HTML build per Hesprs README) and shows the same.
4. `pnpm dmv sqlite-to-canvas examples/chinook.sqlite` produces a canvas with ≥10 tables and ≥8 FK edges (Chinook has 11 tables, 8 FKs).
5. Postgres path verified against a local container (`docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=pw postgres:16` + seed script).
6. DuckDB path verified against a `.duckdb` file containing at least two tables with a `REFERENCES` constraint.
7. README has a "Quickstart" section showing the four CLI invocations with copy-pasteable examples.

## 9. Anti-scope drift checklist

If Claude Code is tempted to do any of these in Phase 1, **stop and check with the user**:

- Adding a web UI of any kind.
- Pulling in `dagre`, `elkjs`, or any layout engine beyond grid.
- Adding "auto-detect database type" logic — keep subcommands explicit.
- Writing migration runners, schema diff tools, or DDL emitters.
- Inventing a new DSL alongside DBML. DBML is the canonical format. Period.
- Inferring schemas from sample data. That's Phase 4 Cosmos work.
- Mocking the database in tests. Use real `better-sqlite3` against a temp file; real DuckDB; real Postgres against a docker container.

## 10. How Claude Code should start

The first concrete task (suggested order):

1. Scaffold `package.json`, `tsconfig.json`, install deps: `@dbml/core`, `@dbml/connector`, `better-sqlite3`, `@duckdb/node-api`, `cac`, `vitest`.
2. Write `src/canvas/types.ts` matching `spec/canvas-convention.md` (JSON Canvas v1.0 + `dmv` extension).
3. Write `src/dbml/parse.ts` (wrap `@dbml/core` Parser to return a normalized `Table[]` / `Ref[]`).
4. Write `src/canvas/markdown.ts` (render a `Table` as Markdown table).
5. Write `src/canvas/layout.ts` (grid: N tables in `ceil(sqrt(N))` columns, each cell 360×{auto}px with 80px gutter).
6. Write `src/canvas/build.ts` (compose: DBML AST → canvas with text nodes + edges).
7. Write `src/cli.ts` with the `dbml-to-canvas` subcommand.
8. Add `examples/blog.dbml`, run end-to-end, commit `examples/blog.canvas` as the snapshot fixture.
9. **Visual checkpoint:** open `examples/blog.canvas` in Obsidian Canvas; if it looks reasonable, push.
10. Then loop in the three DB sources, one at a time, each with its own test.

Do not write all four sources in parallel. Land DBML → canvas first, verify it visually, then add sources.
