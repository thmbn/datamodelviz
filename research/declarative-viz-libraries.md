# Declarative Visualization Libraries Landscape

A survey of ~20 popular open-source tools where diagrams are authored as text (DSL, JSON, YAML) rather than dragged around a canvas. Compiled to give `datamodelviz` (relational data model -> JSON Canvas converter) a view of the broader text-to-diagram ecosystem.

## Landscape summary

**Mermaid is dominant** by a wide margin (~88k stars) thanks to native rendering in GitHub, GitLab, Notion, Obsidian, and most documentation toolchains — being "in the Markdown pipe" beats every technical advantage a competitor offers. **D2 (~24k) is the most credible challenger**, growing fast on the strength of its TALA auto-layout engine which genuinely beats Mermaid's dagre and PlantUML's GraphViz for non-trivial architecture diagrams; the limiting factor is platform support (D2 requires a build step everywhere). PlantUML (~13k) is the elder statesman — comprehensive UML coverage, ugly defaults, declining mindshare but huge install base via C4-PlantUML (~7k stars) in the enterprise architecture world.

**Where the innovation is happening:** (1) better auto-layout (D2's TALA, Penrose's constraint-based system); (2) architecture-as-code with live model sync (Likec4, Structurizr); (3) domain-specific text DSLs that compile to SVG (WaveDrom for timing, bytefield-svg for binary layouts, WireViz for cable harnesses, Markmap for mind maps). The "convert one text format to another visual artifact" pattern is now well-established — Kroki alone wraps 25+ such tools behind one HTTP endpoint.

**Relevant to datamodelviz:** the closest neighbors conceptually are (a) **D2 / Mermaid / nomnoml** — text -> node-and-edge graph renderers, where your DBML -> JSON Canvas pipeline is essentially the same shape with a different output target; (b) **Kroki** — proves the "one tool wraps many text-to-diagram formats" pattern is viable as a long-running service; (c) **DBML itself** (~3.6k stars) — your primary input format, which sits in this landscape too. The convention worth noting: every successful tool in this space ships a CLI (`tool input.txt -o output.svg`) before it ships anything else.

Star counts captured 2026-05-28 via GitHub API. Where star counts are approximate, the count is rounded.

---

### General-purpose text DSL diagram tools

| Name | Stars | License | Lang | Input | Output | What it does | Differentiator |
|---|---|---|---|---|---|---|---|
| [Mermaid](https://github.com/mermaid-js/mermaid) | 88.3k | MIT | TypeScript | Text DSL (Markdown-style) | SVG | Renders flowcharts, sequence, class, state, ER, Gantt, mindmap, and many more diagram types from a single text DSL. | The default everywhere — native render in GitHub, GitLab, Notion, Obsidian, every dev docs framework. LLMs know it best. |
| [D2](https://github.com/terrastruct/d2) | 24.0k | MPL-2.0 | Go | Text DSL | SVG, PNG, PDF | Modern declarative diagram language with the TALA auto-layout engine and first-class containers/connections. | Best-in-class auto-layout for architecture diagrams; gracefully handles nested containers and edge routing where Mermaid breaks down. |
| [PlantUML](https://github.com/plantuml/plantuml) | 13.0k | GPL-3.0 | Java | Text DSL | SVG, PNG, ASCII, LaTeX | Veteran text-to-UML renderer covering every UML diagram type plus archimate, JSON, YAML, gantt, mindmap, wireframes. | Widest diagram-type coverage of any DSL; deep ecosystem (C4-PlantUML, asciidoctor-diagram, every IDE plugin). |
| [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML) | 7.3k | MIT | PlantUML | Text DSL (PlantUML macros) | SVG, PNG | Standard library of C4-model macros for PlantUML, so you write `Person(...)` and `System(...)` instead of raw UML. | De facto enterprise standard for C4 architecture diagrams — the reason PlantUML still owns the architecture-doc niche. |
| [nomnoml](https://github.com/skanaar/nomnoml) | 2.8k | MIT | TypeScript | Text DSL (ASCII-art style) | SVG, PNG | Renders UML-like class/sequence diagrams from a compact ASCII-bracket DSL designed to read well in source. | Source readability — the DSL itself looks like a hand-drawn diagram. Single-file JS embed; no server. |
| [state-machine-cat](https://github.com/sverweij/state-machine-cat) | 0.9k | MIT | TypeScript | Text DSL | SVG, dot, SCXML | Tightly-scoped DSL for finite state machines that also round-trips to SCXML. | Best-of-breed for one job (FSMs); demonstrates the "narrow DSL, multiple output formats" pattern. |

### Architecture / system-design DSLs

| Name | Stars | License | Lang | Input | Output | What it does | Differentiator |
|---|---|---|---|---|---|---|---|
| [mingrammer/diagrams](https://github.com/mingrammer/diagrams) | 42.3k | MIT | Python | Python code (declarative API) | PNG, SVG | "Diagram as code" via a Python DSL — `with Diagram(...)` blocks containing AWS/GCP/Azure cloud icons. | Iconography is the product — hundreds of high-fidelity cloud-provider node icons. Written in code (Python), rendered via GraphViz. |
| [Likec4](https://github.com/likec4/likec4) | 3.3k | MIT | TypeScript | Text DSL (Likec4 lang) | SVG, PNG, HTML, React | C4-model architecture-as-code with a typed language, LSP, live preview, multiple views from one model. | Treats architecture as a checked, version-controlled model (not just diagrams). Generates an interactive HTML site, not just images. |
| [Structurizr DSL](https://github.com/structurizr/dsl) | ~1.4k | Apache-2.0 | Java | Text DSL | JSON workspace (rendered by Structurizr) | Textual DSL wrapping Structurizr's C4 Java model; defines one model, generates many diagrams. | Original "single source of truth -> many C4 views" tool; ThoughtWorks Tech Radar pick for diagrams-as-code. |
| [Structurizr Java](https://github.com/structurizr/java) | 1.1k | Apache-2.0 | Java | Java API | JSON workspace | The underlying programmatic API that the Structurizr DSL compiles to. | Reference implementation for the C4-model data format that the wider Structurizr ecosystem consumes. |

### Graph / general visualization grammars

| Name | Stars | License | Lang | Input | Output | What it does | Differentiator |
|---|---|---|---|---|---|---|---|
| [Apache ECharts](https://github.com/apache/echarts) | 66.4k | Apache-2.0 | TypeScript | JSON spec | Canvas, SVG | Declarative JSON-spec charting library covering line/bar/scatter/sankey/graph/3D and beyond. | The most popular pure-declarative charting library; the "JSON config in, interactive chart out" model at massive scale. |
| [Vega](https://github.com/vega/vega) | 11.9k | BSD-3-Clause | JavaScript | JSON spec (visualization grammar) | SVG, Canvas | Low-level visualization grammar: you describe data, scales, marks, signals, and Vega renders. | The grammar approach — every chart in Vega is a value in the same JSON schema, enabling tooling/composition. |
| [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) | 11.0k | MIT | JavaScript | JSON spec (nodes + edges) | Canvas, SVG | Graph theory library for network visualization and analysis with declarative style/layout config. | Graph-domain depth — built-in layouts, traversal algorithms, style selectors. The canonical web graph-viz library. |
| [Vega-Lite](https://github.com/vega/vega-lite) | 5.3k | BSD-3-Clause | TypeScript | JSON spec (concise grammar) | SVG, Canvas | High-level grammar that compiles down to Vega; the JSON spec backing Altair (Python) and Observable Plot-adjacent tools. | The most influential JSON viz grammar in academia/notebooks; compiles to Vega for rendering. |
| [draw.io / diagrams.net](https://github.com/jgraph/drawio) | 5.6k | Apache-2.0 | JavaScript | XML (mxGraph) or visual editor | XML, SVG, PNG | Primarily a WYSIWYG editor, but the underlying XML format is a declarative spec that round-trips. | Included because the XML format is often hand-edited / generated; the dominant "open visual editor" the text-DSL world is reacting against. |

### Domain-specific text DSLs

| Name | Stars | License | Lang | Input | Output | What it does | Differentiator |
|---|---|---|---|---|---|---|---|
| [WireViz](https://github.com/wireviz/WireViz) | 5.1k | GPL-3.0 | Python | YAML | SVG, PNG, HTML, BOM | Documents cables and wiring harnesses from a YAML spec — connectors, pins, wires, BOM. | Only OSS tool of note in the electrical-harness niche; YAML-in/PDF-quality-out for hardware docs. |
| [svgbob](https://github.com/ivanceras/svgbob) | 4.2k | Apache-2.0 | Rust | ASCII art | SVG | Converts ASCII-art diagrams (boxes with `+--+`, arrows with `-->`) into clean SVG. | "Your existing ASCII diagrams render as SVG" — zero new syntax to learn; ASCII source stays human-readable. |
| [holistics/DBML](https://github.com/holistics/dbml) | 3.6k | Apache-2.0 | JavaScript | Text DSL | JSON AST, SQL DDL, ERD | Database Markup Language — text DSL for relational schemas, the canonical OSS schema-as-text language. | The input format `datamodelviz` consumes. See also the separate relational-data-model-viz landscape doc. |
| [WaveDrom](https://github.com/wavedrom/wavedrom) | 3.4k | MIT | JavaScript | JSON5 spec | SVG | Renders digital timing waveform diagrams from a compact JSON5 spec (`{ signal: [...] }`). | De facto standard for digital hardware timing diagrams in datasheets and HDL docs. |
| [Markmap](https://github.com/markmap/markmap) | 12.8k | MIT | TypeScript | Markdown | SVG, HTML | Renders nested Markdown bullet lists as interactive mind maps. | Zero-DSL — your existing Markdown outline IS the input. Best-in-class mindmap renderer. |
| [Railroad Diagrams](https://github.com/tabatkins/railroad-diagrams) | 1.7k | MIT | Python + JS | Declarative function calls | SVG | Generates BNF-style railroad/syntax diagrams (like json.org) from nested constructor calls. | The reference tool for grammar/syntax docs; powers many language spec websites. |
| [ditaa](https://github.com/stathissideris/ditaa) | 1.0k | LGPL-3.0 | Java | ASCII art | PNG, SVG | Converts ASCII-art diagrams into rasterized bitmap images with color, shadows, shapes. | Established (since 2004) ASCII-to-bitmap converter; integrated into AsciiDoc, Pandoc, Kroki. |
| [bytefield-svg](https://github.com/Deep-Symmetry/bytefield-svg) | 0.2k | EPL-2.0 | Clojure | EDN spec (Clojure data) | SVG | Renders byte/bit layout diagrams for protocol and file-format documentation. | The standard for binary protocol layout diagrams; the natural companion to WaveDrom. |
| [BurntSushi/erd](https://github.com/BurntSushi/erd) | 1.9k | Unlicense | Haskell | Text DSL | PDF, SVG, PNG via Graphviz | Translates plain-text relational-schema descriptions into ERD images via Graphviz layout. | Veteran in the text->ERD niche; same problem space as DBML but older and Graphviz-rendered. See separate ERD landscape doc. |

### Aggregators and bridges

| Name | Stars | License | Lang | Input | Output | What it does | Differentiator |
|---|---|---|---|---|---|---|---|
| [Kroki](https://github.com/yuzutech/kroki) | 4.2k | MIT | Java/JavaScript | HTTP POST of any supported DSL | SVG, PNG, PDF | One HTTP service that wraps 25+ diagram tools (Mermaid, PlantUML, D2, Graphviz, BlockDiag family, Pikchr, bytefield, WaveDrom, etc.) behind a unified `/diagram/<type>` API. | The "stop installing 12 renderers" tool — proves the ecosystem is wide enough that an aggregator is itself a popular project. |
| [mermaid-to-excalidraw](https://github.com/excalidraw/mermaid-to-excalidraw) | 0.8k | MIT | TypeScript | Mermaid text | Excalidraw JSON | Parses Mermaid diagrams and emits the equivalent Excalidraw scene so users can hand-tweak. | The clearest example in the wild of "convert text DSL -> canvas-style JSON format" — exactly the shape of `datamodelviz`'s DBML -> JSON Canvas pipeline. |

### Honorable mentions (not in main list)

- **Excalidraw** (124k stars, MIT, TS) — primarily a visual editor, but `.excalidraw` files are a declarative JSON format and the mermaid-to-excalidraw bridge makes it relevant.
- **Penrose** (7.9k stars, MIT, TS) — research-grade declarative diagramming using a Substance/Style/Domain triple; ambitious but niche.
- **BlockDiag family** (`blockdiag`/`seqdiag`/`actdiag`/`nwdiag`, ~50-250 stars each, Apache-2.0, Python) — older Python text-DSL diagram suite; mostly relevant because Kroki and Sphinx ecosystems still ship them.
- **PGF/TikZ** (1.3k stars, no SPDX license, TeX) — the LaTeX gold standard for hand-coded diagrams; declarative but tied to LaTeX toolchain so excluded from the main 20.
- **Pikchr** (Fossil/SQLite ecosystem, mirrored at [kinnison/pikchr](https://github.com/kinnison/pikchr) ~20 stars) — modernized PIC for technical-doc diagrams; used heavily inside the SQLite docs but low GitHub presence.
- **Graphviz / DOT** — the foundational text-to-graph engine almost everything in this list eventually delegates to; the canonical repo lives on GitLab (`gitlab.com/graphviz/graphviz`) so it doesn't get a GitHub star count, but it's effectively everywhere.

---

## Notes for datamodelviz

1. **The CLI-first convention is near-universal.** Every successful tool in this landscape ships `tool input.<ext> -o output.<ext>` as the primary surface, with browser/IDE integrations layered on top. The `sqlite -> dbml -> .canvas` script already follows this pattern.
2. **The closest functional analogue is mermaid-to-excalidraw** — text DSL parsed -> emitted as a canvas-app's native JSON format. Worth reading their parser/transformer split for conventions.
3. **Auto-layout is the moat.** D2's TALA and Penrose's constraint solver are where the real innovation is happening in this space; relational schema -> JSON Canvas would benefit from any thoughtful layout heuristic beyond "grid".
4. **Kroki is the integration target to watch.** If `datamodelviz` ever wants distribution without users installing it, getting on Kroki's supported-list is a meaningful milestone.
5. **DBML's own ecosystem is small** (~3.6k stars, one renderer) — there's real room for a quality output target like JSON Canvas / Obsidian to grow the DBML user base by extension.

---

## Sources

- [text-to-diagram.com comparison site](https://text-to-diagram.com/)
- [Kroki supported diagram types](https://kroki.io/)
- [GitHub topic: diagrams-as-code](https://github.com/topics/diagrams-as-code)
- [GitHub topic: text-to-diagram](https://github.com/topics/text-to-diagram)
- [D2 community debate (BigGo, Oct 2025)](https://biggo.com/news/202510260715_D2-diagram-language-community-debate)
- [Mermaid vs PlantUML vs D2 comparison (diagrams.so)](https://diagrams.so/learn/diagram-as-code-comparison)
- All star counts captured via `gh api repos/<owner>/<repo>` on 2026-05-28.
