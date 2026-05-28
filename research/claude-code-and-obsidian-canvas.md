# Claude Code + Obsidian Canvas

> Reshaped from an earlier *Obsidian CLI research* session (2026-05). Two questions: (1) has anyone demonstrated using Claude Code to iterate on `.canvas` files, and (2) what plugins / native objects can a `.canvas` actually hold?

## 1. Has anyone demonstrated using Claude Code to iterate on Obsidian Canvases?

### TL;DR

- **Creation: yes, multiple public demos.**
- **Iteration on an *existing* canvas: not really demonstrated publicly.**
- The gap isn't technical (`.canvas` is just JSON) — it's that visual-layout decisions are still faster done by hand. There's an open opportunity for a `canvas-iterate` skill that handles structural edits while leaving layout alone.

### Creation — well-trodden ground

Several public Claude Code skills exist for generating `.canvas` files from natural-language prompts:

- [`json-canvas`](https://mcpmarket.com/tools/skills/json-canvas)
- [`json-canvas-manager`](https://mcpmarket.com/tools/skills/json-canvas-manager-8)
- `obsidian-json-canvas` (community variant)

Plus dedicated write-ups:

- [Building Claude Skills That Connect to Obsidian — DEV.to field guide](https://dev.to/scorp323/building-claude-skills-that-connect-to-obsidian-a-developers-field-guide-4a2k)
- [Obsidian + Claude Code Integration Guide — Starmorph](https://blog.starmorph.com/blog/obsidian-claude-code-integration-guide)
- [Obsidian Canvas Automation: Drawing Guide — Wenhao](https://blog.wenhaofree.com/en/posts/articles/obsidian-skills-canvas-integration-guide/)

The pattern is consistent across all of them: **inject the [JSON Canvas 1.0 spec](https://jsoncanvas.org/spec/1.0/) into the skill's context**, then let Claude emit a valid `.canvas` from a prompt like *"trading system architecture: ingestion → signals → risk → execution."* They claim deterministic, valid files when the spec is in-context.

### Iteration — not demonstrated

The Starmorph guide and the Wenhao canvas walkthrough both explicitly say the AI-generated canvas is a *starting point* and that refinement happens manually — drag nodes in Obsidian's UI, or hand-edit the JSON. None of the write-ups found show a "Claude, on the canvas at `foo.canvas`, add three nodes, color the external services red, and rewire X→Y" loop.

### Why the gap

- **Mechanically, iteration is trivial.** `.canvas` is just JSON; Claude Code's `Read`/`Edit`/`Write` tools operate on it directly. The Obsidian CLI itself has no canvas-specific commands.
- **The real reason nobody's published a polished iterate-canvas skill is probably that visual layout decisions are faster done by hand.** Claude is good at *structural* edits (add/remove/rewire nodes, recolor by category, bulk-rename labels, regenerate edge labels from node content). It's bad at "make this look better."
- **Structurally-categorical canvases are the sweet spot.** Anything where nodes have inherent classes (accounts by type, services by tier, tables by schema) is a good candidate — Claude can maintain the categorical structure consistently and faster than a human.

### Implications for datamodelviz

This finding is *directly* relevant. datamodelviz emits `.canvas` from a structurally-categorical input (a DBML schema). Two follow-ons worth considering:

1. **A "rerun on schema change" loop is the obvious iteration story** — re-generate the `.canvas` from updated DBML, preserving node positions where possible. (Layout preservation across regenerations is the missing piece in the "iterate" gap above.)
2. **A `canvas-iterate` Claude Code skill that round-trips through the `dmv` extension** (see [canvas-convention.md](../spec/canvas-convention.md)) could be the missing demo: Claude reads the `dmv.table` blocks, mutates them, regenerates the `text` and the FK edges, writes the file back. Layout untouched.

---

## 2. Plugins and native objects that show inside an Obsidian-compatible `.canvas`

### Top 20 canvas plugins by popularity

Ranked per [obsidianstats.com/tags/canvas](https://www.obsidianstats.com/tags/canvas) (aggregate signals — downloads + recency, not pure download counts; the order shifts week to week).

| # | Plugin | What it does |
|---|---|---|
| 1 | [Advanced Canvas](https://community.obsidian.md/plugins/advanced-canvas) | Visual layouts: presentations, flowcharts, custom node/edge styles, portals, focus & presentation modes |
| 2 | Canvas Mindmap | Turn a canvas into a mind map with auto-layout and keyboard-driven node creation |
| 3 | Simple CanvaSearch | Fuzzy search to jump to specific notes on a large canvas |
| 4 | Canvas LLM Extender | Call an LLM from inside the canvas to generate text nodes from surrounding context |
| 5 | Crafty | Find-and-replace with regex across notes (verify behavior before relying on it) |
| 6 | Canvas Send to Back | Reorder card layering (z-order) |
| 7 | Canvas Links | Visualize how canvas files connect to vault notes |
| 8 | CardNote | Drag-and-drop block extraction onto canvases for spatial note organization |
| 9 | Optimize Canvas Connections | Better routing for edges between nodes |
| 10 | Canvas2Document | Flatten a canvas (cards, notes, images, videos, embeds) into a linear markdown document |
| 11 | Collapse Node | Expand/collapse nodes via commands |
| 12 | Canvas Card Background Remover | Transparent backgrounds for specific embed types (PNG, canvas, markdown) |
| 13 | Canvas Explorer | Auto-generate canvases from existing note-to-note links with sort/color rules |
| 14 | Index Checker | Verify your MOC/index files actually link to all relevant canvases & notes |
| 15 | Lovely-Mindmap | Interactive mind maps with keyboard shortcuts and layout options |
| 16 | Canvas Connect | Smarter connection anchors so lines stay readable |
| 17 | Node Auto Resize | Nodes auto-size to fit their content |
| 18 | Canvas Link Optimizer | Replace heavyweight live web embeds with preview thumbnails |
| 19 | Canvas Mindmap Helper | Alternative mind-mapping helpers (overlaps with #2 and #15) |
| 20 | Caret | Local-first LLM chat inside the canvas |

### Native objects a `.canvas` can hold (no plugin required)

- **Markdown notes** (`.md`) — fully rendered, including any Mermaid / Dataview / etc. they contain
- **Text nodes** — raw markdown blobs not tied to a file (this is what datamodelviz emits today)
- **Images** — PNG, JPG, GIF, WebP, SVG, BMP
- **PDFs** — page-scrollable
- **Audio** — MP3, WAV, M4A, OGG, FLAC, 3GP (inline player)
- **Video** — MP4, WebM, MKV, OGV, MOV (inline player)
- **Other `.canvas` files** — nested canvas embed
- **URLs / web embeds** — arbitrary webpage in an iframe-style node
- **Groups** — labelled containers that hold other nodes

### Implications for datamodelviz

- **Text nodes are the right primitive for v1** (already chosen). Markdown render quality is consistent across Obsidian + Hesprs + any other JSON Canvas viewer.
- **Native `.md` file nodes** are a strong v2 option: write each table as a separate `.md` file (`tables/users.md`, `tables/posts.md`, …) and reference them from the canvas. Benefits: tables become first-class vault citizens (backlinkable, searchable, taggable), Obsidian's graph view picks them up, you can hand-edit a table's docs without touching the canvas JSON.
- **Groups** become useful once schemas grow large enough to need clustering by schema name or domain (e.g. `auth.*`, `billing.*`). Worth thinking about for Phase 2.
- **Plugin compatibility is mostly a non-issue** because the file format is the spec — anything that respects JSON Canvas 1.0 will read our output. Advanced Canvas's custom node styles, Canvas2Document's flatten, and Canvas LLM Extender all work transparently. Plugins that *write* canvas files (e.g. Canvas Explorer) might re-layout aggressively; warn users to back up before letting them touch a generated canvas.

---

## Sources

**On Claude Code × Obsidian Canvas:**
- [Building Claude Skills That Connect to Obsidian — DEV.to](https://dev.to/scorp323/building-claude-skills-that-connect-to-obsidian-a-developers-field-guide-4a2k)
- [Obsidian + Claude Code: Complete Integration Guide — Starmorph](https://blog.starmorph.com/blog/obsidian-claude-code-integration-guide)
- [Obsidian Canvas Automation: Drawing Guide with Claude Code Skills — Wenhao](https://blog.wenhaofree.com/en/posts/articles/obsidian-skills-canvas-integration-guide/)
- [JSON Canvas Claude Code Skill — MCP Market](https://mcpmarket.com/tools/skills/json-canvas)
- [JSON Canvas Manager Claude Code Skill — MCP Market](https://mcpmarket.com/tools/skills/json-canvas-manager-8)

**On Obsidian canvas plugins:**
- [All canvas Obsidian plugins — Obsidian Stats](https://www.obsidianstats.com/tags/canvas)
- [Advanced Canvas — Obsidian community page](https://community.obsidian.md/plugins/advanced-canvas)
- [Obsidian plugin directory (canvas search)](https://obsidian.md/plugins?search=Canvas)
- [7 Obsidian Canvas enhancements — Mind Mapping Software Blog](https://mindmappingsoftwareblog.com/7-obsidian-canvas-enhancements/)
- [Best Obsidian Plugins for 2026 — Sébastien Dubois](https://www.dsebastien.net/the-must-have-obsidian-plugins-for-2026/)
