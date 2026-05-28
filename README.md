# datamodelviz

## Research

Landscape of open-source relational data model visualization tools. The space has a clear modern leader (**DrawDB**, ~37k stars) but no monopoly — **ChartDB** went 0→22k in ~18 months. Three architectural patterns dominate: browser-based React/ReactFlow editors, CLI introspection tools that emit Markdown/Mermaid, and the DBML text-DSL ecosystem. AGPL-3.0 is the de facto license for the new wave of OSS-but-hosted editors.

### ER editors (standalone web/desktop apps)

| Tool | Stars | License | Stack | Differentiator |
|---|---|---|---|---|
| [DrawDB](https://github.com/drawdb-io/drawdb) | ~37.3k | AGPL-3.0 | JS/React | Most polished free UI; "Figma of ERDs" |
| [ChartDB](https://github.com/chartdb/chartdb) | ~22.3k | AGPL-3.0 | TS | Paste one introspection query → diagram; AI dialect conversion |
| [Liam ERD](https://github.com/liam-hq/liam) | ~4.8k | Apache-2.0 | TS | Tuned for large schemas (100+ tables); auto-gen from Postgres/Prisma/Rails |
| [Azimutt](https://github.com/azimuttapp/azimutt) | ~2.1k | MIT | Elm | Built for ~1000-table messy real-world schemas; strong filtering |
| [erd-editor (dineug)](https://github.com/dineug/erd-editor) | ~1.7k | MIT | TS | PWA + VS Code + JetBrains; E2E-encrypted realtime collab |

### Schema-from-database CLIs (introspection)

| Tool | Stars | License | Stack | Differentiator |
|---|---|---|---|---|
| [tbls](https://github.com/k1LoW/tbls) | ~4.2k | MIT | Go | Docs-as-code king; Markdown out, runs in CI, supports ~15 datastores |
| [SchemaSpy](https://github.com/schemaspy/schemaspy) | ~3.7k | LGPL-3.0 | Java | 20-year elder statesman; JDBC → full static HTML site |
| [SchemaCrawler](https://github.com/schemacrawler/SchemaCrawler) | ~1.8k | LGPL-style | Java | Programmable + Docker; strong schema linting |
| [ERAlchemy](https://github.com/eralchemy/eralchemy) | ~1.4k | Apache-2.0 | Python | Python default; SQLAlchemy → Graphviz |
| [mermerd](https://github.com/KarnerTh/mermerd) | ~600 | MIT | Go | Smallest/sharpest; single binary, interactive picker, Mermaid out |

### DSL- / spec-based (text as source of truth)

| Tool | Stars | License | Stack | Differentiator |
|---|---|---|---|---|
| [Mermaid (erDiagram)](https://github.com/mermaid-js/mermaid) | ~88.3k | MIT | TS | General-purpose, but GitHub renders it natively — ubiquitous in READMEs |
| [Atlas](https://github.com/ariga/atlas) | ~8.4k | Apache-2.0 | Go | Schema-as-code migration tool; ERD is a side effect |
| [DBML](https://github.com/holistics/dbml) | ~3.6k | Apache-2.0 | JS | The standard DSL — everyone consumes or exports it |
| [prisma-erd-generator](https://github.com/keonik/prisma-erd-generator) | ~1.0k | MIT | TS | Drops into `prisma generate`; default for Prisma users |
| [BurntSushi/erd](https://github.com/BurntSushi/erd) | ~1.9k | Unlicense | Haskell | Original text→ERD tool, abandoned (last release May 2023) |
| [dbml-renderer](https://github.com/softwaretechnik-berlin/dbml-renderer) | ~300 | MIT-style | JS | DBML → standalone SVG via Graphviz; pure CLI |

### Embeddable libraries (ship inside your own app)

| Tool | Stars | License | Stack | Differentiator |
|---|---|---|---|---|
| [React Flow / xyflow](https://github.com/xyflow/xyflow) | ~36.8k | MIT | TS | Not ERD-specific, but the substrate for DrawDB/ChartDB/Liam/dbSpy |
| [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) | ~11k | MIT | JS | Graph-theory layouts for very dense relational graphs |
| [JointJS (core)](https://github.com/clientIO/joint) | ~5.3k | MPL-2.0 | JS | Older API but ships ready-made ERD shape kits |
| [sql_schema_visualizer](https://github.com/sqlhabit/sql_schema_visualizer) | ~270 | MIT | TS | Reference React+ReactFlow ERD impl — fork-friendly starter |

### Desktop GUIs (ERD as one feature)

| Tool | Stars | License | Stack | Differentiator |
|---|---|---|---|---|
| [DBeaver](https://github.com/dbeaver/dbeaver) | ~50.3k | Apache-2.0 | Java | Universal SQL client; ERD is incidental but "free" for existing users |
| [pgModeler](https://github.com/pgmodeler/pgmodeler) | ~3.6k | GPL-3.0 | C++/Qt | Only tool modeling every Postgres-specific feature |
