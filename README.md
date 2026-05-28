# datamodelviz

## Spec

- [Design doc](spec/design.md) — Phase 1 "fastest demo" architecture, tech stack, CLI surface, acceptance criteria, anti-scope checklist.
- [Canvas convention](spec/canvas-convention.md) — how relational tables are encoded into JSON Canvas `.canvas` files via a `dmv` extension that round-trips through Obsidian and Hesprs's viewer.

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

## DBML notes

DBML's official tooling ([`@dbml/cli`](https://github.com/holistics/dbml) from holistics/dbml) is opinionated toward classic relational warehouses. Coverage across the four targets we care about is uneven — two are first-class, two are not.

| DB | Official `db2dbml` | Best alternative |
|---|---|---|
| PostgreSQL | Yes | `db2dbml postgres` |
| SQLite | No ([#14](https://github.com/holistics/dbml/issues/14) open since 2019) | community gist / SchemaCrawler |
| DuckDB | No | `EXPORT DATABASE` + `sql2dbml --postgres` |
| Cosmos DB | No | Custom JSON-schema inference; no off-the-shelf path |

### PostgreSQL

**Status:** First-class. Best-supported target in the ecosystem.

```
db2dbml postgres 'postgresql://user:pass@host:5432/dbname?schemas=public,other' -o out.dbml
```

`sql2dbml --postgres schema.sql` also works for offline DDL. See the [CLI docs](https://dbml.dbdiagram.io/cli).

**Gotchas:** Custom `ENUM` types round-trip cleanly (DBML has native `Enum`). `DOMAIN` types, `CITEXT`, ranges, arrays, JSONB, and PostGIS geometries collapse to plain column-type strings — no semantic loss but no validation either. Partitioned tables show up as the parent only. Multi-schema dumps require the `?schemas=` query param or only `public` is exported.

### SQLite

**Status:** Not supported by `db2dbml`. Open feature request since 2019 ([issue #14](https://github.com/holistics/dbml/issues/14)), still labeled `help wanted` with no linked PRs. `sql2dbml` also does not accept a `--sqlite` dialect (only mysql/postgres/mssql/snowflake/oracle).

**Workarounds:**
- Community Python script: [promto-c gist](https://gist.github.com/promto-c/2c3ca92f49c2dcd5e30205a8c69d4a70) — reads `sqlite_master` and emits DBML with FKs. Single-file, unmaintained.
- SchemaCrawler in Docker can dump from a SQLite file.

**Gotchas:** SQLite's type affinity (anything goes into a `TEXT` column, declared types are advisory) means DBML output will faithfully reproduce whatever odd type names the DDL used (`VARCHAR2`, `DATETIME`, etc.). Foreign keys exist in the schema even if `PRAGMA foreign_keys=OFF` at runtime — converters should still find them via `PRAGMA foreign_key_list(table)`.

### DuckDB

**Status:** Not supported by `db2dbml`. No open issue, no community DuckDB→DBML converter found on GitHub.

**Workarounds:**
- [`duckerd`](https://github.com/tobilg/duckerd) (~150 stars) generates ER diagrams (svg/png/pdf) from `.duckdb` files but **does not emit DBML**.
- Realistic path: `EXPORT DATABASE 'dir'` → take the generated `schema.sql` → run it through `sql2dbml --postgres` (DuckDB's DDL is largely Postgres-compatible). Expect to hand-edit.

**Gotchas:** DuckDB's analytical types (`STRUCT`, `LIST`, `MAP`, `UNION`, `HUGEINT`, nested types) have no DBML equivalent and will need to be stringified or flattened. DuckDB has no real FK enforcement (FKs parse but aren't checked) so relationship recovery via `information_schema.referential_constraints` is unreliable — many DuckDB schemas have zero declared FKs.

### Azure Cosmos DB

**Status:** Not supported, and only marginally meaningful. No DBML converter exists for any Cosmos API (NoSQL, Mongo, Cassandra, Gremlin, Table).

**Impedance mismatch:** DBML assumes tables, typed columns, and referential FKs. Cosmos for NoSQL stores schemaless JSON documents in containers partitioned by a path; "relationships" are denormalized embeds or app-enforced `id` references with no DB-side constraint. Hierarchical partition keys, TTL, and analytical store schema unioning have no DBML representation. The Cassandra and Gremlin APIs are even further from the relational model.

**Workarounds (all DIY):**
- Sample N documents per container, infer a JSON Schema (e.g. `genson`, `quicktype`), then hand-map each top-level container to a DBML `Table` and embedded objects to separate tables joined by synthetic `id`s. This is what [Hackolade](https://hackolade.com/help/CosmosDB.html) does commercially, but it doesn't emit DBML.
- For the Mongo API specifically, point any Mongo→ERD inferencer at the connection string and convert from there.

**Honest take:** generating DBML for Cosmos is a lossy editorial exercise, not a mechanical export. If the build decision hinges on Cosmos coverage, plan to write the inferencer yourself and treat DBML as documentation-only.

## DBML import (DBML → DB)

The reverse direction. `dbml2sql` officially emits only four dialects — `--postgres` (default), `--mysql`, `--mssql`, `--oracle` ([CLI docs](https://dbml.dbdiagram.io/cli)) — so coverage mirrors export: one first-class target, three workarounds.

| DB | Official `dbml2sql` | Best path |
|---|---|---|
| PostgreSQL | Yes (`--postgres`) | pipe to `psql` |
| SQLite | No | third-party [`dbml-sqlite`](https://pypi.org/project/dbml-sqlite/) |
| DuckDB | No | `dbml2sql --postgres` → load in DuckDB |
| Cosmos DB | No | n/a — DDL is not a Cosmos concept |

### PostgreSQL

**Status:** First-class.

```
dbml2sql --postgres schema.dbml | psql 'postgresql://user:pass@host:5432/dbname'
```

**Gotchas:** DBML `Enum` becomes `CREATE TYPE ... AS ENUM`. FKs use inline `REFERENCES`. `indexes { }` blocks emit as separate `CREATE INDEX`. Integer PKs require `[increment]` in DBML to produce `SERIAL` — plain `int [pk]` stays `integer`.

### SQLite

**Status:** Not supported by `dbml2sql`. Use [`dbml-sqlite`](https://github.com/dvanderweele/DBML_SQLite) (Python, last touched 2021); understands DBML directly and can execute against a `.sqlite` file.

```
pip install dbml-sqlite
dbml-sqlite -x mydb.sqlite schema.dbml      # execute against DB
dbml-sqlite -w schema.sql schema.dbml       # or emit DDL, then: sqlite3 mydb.sqlite < schema.sql
```

**Gotchas:** SQLite has no `ENUM` — the tool emulates via a lookup table (`-f`) or a `CHECK (col IN (...))` constraint (`-h`). `dbml2sql --postgres` output is *not* a fallback: SQLite rejects `SERIAL`, `CREATE TYPE`, and most `ALTER TABLE ... ADD CONSTRAINT` forms.

### DuckDB

**Status:** No DuckDB target. DuckDB's DDL is close enough to Postgres that `dbml2sql --postgres` output runs with minor edits.

```
dbml2sql --postgres schema.dbml -o schema.sql
duckdb mydb.duckdb < schema.sql
```

**Gotchas:** DuckDB rejects `SERIAL` — substitute `INTEGER GENERATED BY DEFAULT AS IDENTITY`. `CREATE TYPE ... AS ENUM` works (native enums). FKs parse but aren't enforced. `CREATE INDEX` runs but is largely a no-op on columnar storage. Strip `ALTER TABLE ... ADD CONSTRAINT` lines if they error; inline `REFERENCES` is more reliable.

### Azure Cosmos DB

**Status:** Not supported, and the question barely type-checks. Cosmos is schema-on-read — there is no DDL. Provisioning a container needs a name, a partition key path, and optionally an indexing policy and throughput; none of those are expressible in DBML.

**What "importing DBML" could mean (DIY):** treat each `Table` as a container and script `az cosmosdb sql container create` calls — but you have to invent the partition key path (DBML PKs don't map; Cosmos partition keys are about write distribution, not uniqueness). Indexing policies, FKs, enums, and column types are all dropped — Cosmos enforces none of them.

**Honest take:** there is no meaningful "load DBML into Cosmos." At best DBML is a checklist of containers to provision; the partition-key and indexing-policy choices — the only ones that matter for cost and performance — live outside DBML entirely.
