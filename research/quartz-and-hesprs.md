# Quartz and Hesprs: two adjacent projects, one is the natural home

> Two open-source projects in the immediate orbit of datamodelviz: **Quartz** (the dominant Obsidian-to-website static-site generator) and **Hesprs/JSON-Canvas-Viewer** (the embeddable JSON Canvas web viewer we already use). Both shipped major versions in May 2026; both moved on canvas support in the same window; the relationship between them — and the resulting opening for datamodelviz — is the interesting bit.

## Quartz

### Background and motivation

[Quartz](https://github.com/jackyzha0/quartz) is built by **[Jacky Zhao](https://jzhao.xyz)** (now at Replit, working on agent infra), started **2021-07-18**. **12.3k stars, MIT, TypeScript, Node 22+.** It is the de facto way to publish an Obsidian vault as a website. Active maintenance shared with a handful of [collaborators](https://github.com/jackyzha0/quartz/graphs/contributors) — most visibly `saberzero1` and `aarnphm` — but Jacky still drives direction. The default branch flipped from `v4` to `v5` in late May 2026 alongside the v5 release.

The stated philosophy ([`docs/philosophy.md`](https://github.com/jackyzha0/quartz/blob/v5/docs/philosophy.md)) is explicit: Quartz exists to "tap into your network's collective intelligence," favours *rhizomatic* over hierarchical organisation, and rejects Zettelkasten-style structure as "too much upfront friction." The product principle: "Quartz should feel powerful but ultimately be an intuitive tool fully within your control" — three tiers of customisation from content-only to full source edits.

### Architecture and opinionation

Quartz is **not** Hugo-derived. v4 was a Preact-based custom SSG built on the unified/remark/rehype pipeline; **v5 is a major rewrite** ([`feat(v5): add plugin system` — PR #2295](https://github.com/jackyzha0/quartz/pull/2295), merged May 2026) that turns every core feature into a first-class plugin. The PR is explicit about the dogfooding goal: "Migrate current Quartz functionality to separate plugins. This serves as both dogfooding, and to provide ample examples for community plugin developers." A new [`quartz-community` org](https://github.com/quartz-community) was created to house the official plugin set (canvas-page, bases-page, types, utils, etc.), and a `quartz plugin add github:owner/repo` CLI ships out of the box.

Jacky has historically pushed back on scope creep — the project deliberately stays a *publishing* tool, not an authoring tool. No built-in editor, no hosted service, no opinionated theming. The v4 → v5 break also dropped the arrow-syntax OFM extension and reworked layout primitives.

### Progress signals

The last numbered GitHub release is **v4.0.8 (Aug 2023)** — Quartz publishes via branches, not tags, which is why the Releases tab looks stale. Real activity is high: 5+ commits per day in the week before 2026-05-28, only 7 open issues. v5 closed several long-standing requests in one shot — [#927 Canvas Support](https://github.com/jackyzha0/quartz/issues/927), [#628](https://github.com/jackyzha0/quartz/issues/628), [#1043 Excalidraw](https://github.com/jackyzha0/quartz/issues/1043), all closed `2026-05-25` with a terse "v5 has been released. Feel free to try it out and reopen the ticket if these are still here."

### Compatibility with what datamodelviz emits

**Quartz v5 renders `.canvas` files natively**, via the [`@quartz-community/canvas-page`](https://github.com/quartz-community/canvas-page) plugin (default-enabled, MIT, Preact). Full JSON Canvas 1.0 spec — text nodes with Markdown, file/link/group nodes, edges with labels and preset/hex colors. Install: `npx quartz plugin add github:quartz-community/canvas-page`.

Crucially: **canvas-page is an in-house Preact reimplementation, not a wrapper around Hesprs's viewer** (verified by package.json — no `json-canvas-viewer` dependency). On [issue #927](https://github.com/jackyzha0/quartz/issues/927) the Hesprs author offered his library in Feb 2026; the Quartz team thanked him but shipped their own renderer two months later. The two now coexist as alternative viewers of the same file format.

## Hesprs/JSON-Canvas-Viewer

### Background and motivation

[Hesprs/JSON-Canvas-Viewer](https://github.com/Hesprs/JSON-Canvas-Viewer) is built by **[Hēsperus](https://hesprs.github.io)** — bio: "A high school student." Solo project, started **2025-06-22**. **63 stars, MIT, TypeScript, pnpm/Turbo monorepo.** Published to npm as `json-canvas-viewer` with framework wrappers under `@json-canvas-viewer/{vue,react,preact}` plus a `vite-plugin-json-canvas`. The DI/hook layer is the sibling project [`hesprs/synthkernel`](https://github.com/hesprs/synthkernel).

README motivation: a viewer that's "More performant than rendering canvases in Obsidian" and trivially embeddable in any site. The badge row includes a deliberate **"Made by Humans"** badge — the project leans into being hand-written and small.

### Architecture and opinionation

Monorepo with a strict split: `packages/core` (engine), `packages/shared` (types and helpers), and framework adapters (`vue`, `react`, `preact`) plus a `vite` plugin. Two-stage instantiation — "During construction, the viewer itself and all modules are instantiated. After construction, the viewer is ready to plug any canvas file" ([`docs/2-🏗️-Construction-Details.md`](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/2-%F0%9F%8F%97%EF%B8%8F-Construction-Details)) — which means one viewer can swap canvases without rebuild. Rendering uses **node-type-specific component injection**: `nodeComponents.{text,image,audio,video,link,markdown}` overrides ship-default renderers. This is the extension hook most relevant to datamodelviz.

Module system documented in [`docs/3-🧩-Modules.md`](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/3-%F0%9F%A7%A9-Modules): `Minimap`, `Controls`, `MistouchPreventer`, `DebugPanel`. Each is tree-shakeable and registered by import. Custom modules extend `BaseModule`, subscribe to lifecycle hooks (`onStart`, `onDispose`, `onRestart`) and to internal service hooks (e.g. `Controller.hooks.onRefresh`), and inject methods into the main instance via an `augment({...})` call ([`5-🧑‍💻-Develop-a-Module.md`](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/5-%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB-Develop-a-Module)).

### Progress signals

Extremely active for a 63-star project: **eight releases since Jan 2026**, latest `v4.3.0` on **2026-05-18** ([releases](https://github.com/Hesprs/JSON-Canvas-Viewer/releases)). The v4.x line is itself a rewrite — recent PRs include [#72 migrate from Vite to Tsdown](https://github.com/Hesprs/JSON-Canvas-Viewer/pull/72) and [#80 simplify path handling and refine API](https://github.com/Hesprs/JSON-Canvas-Viewer/pull/80); v4.3.0 removed four constructor options "which all have cleaner alternatives" — i.e. the API is still being firmed up. **Zero open issues, zero open PRs as of 2026-05-28.** The author also responds in adjacent ecosystems — see his cross-post on [Quartz #927](https://github.com/jackyzha0/quartz/issues/927).

### Compatibility with what datamodelviz emits

Already verified end-to-end: the `examples/demo.canvas` we emit renders cleanly. The modules we'd enable for an ERD use case are `Minimap` (essential once schemas exceed ~10 tables) and `Controls` (zoom/fullscreen). `MistouchPreventer` matters if the viewer is embedded inside a scrollable docs page (e.g. inside a Quartz site).

## The opportunity

**Quartz is the natural distribution channel; Hesprs is the natural extension surface.** They solve different halves of the same problem for datamodelviz.

**Quartz integration is now a real path.** v5 ships native `.canvas` rendering. A datamodelviz Quartz vault could publish a live, pannable view of its data model with zero glue: drop `schema.canvas` into the vault, push, the canvas-page plugin handles the rest. The natural product is a **`datamodelviz` Quartz starter template** — a sample `schema.dbml`, a build hook that runs `dmv dbml-to-canvas` on commit, and a published demo. Friction: canvas-page is brand new (v0.1.0, zero stars) and [PR #1796](https://github.com/jackyzha0/quartz/pull/1796) showed how long this took to ship — expect rough edges around large canvases, FK-edge label rendering, and dark mode for ~3-6 months. There is also a *parser*-side opportunity: a `quartz-community/dbml-page` plugin would let users point Quartz at a `.dbml` file directly. No such plugin exists yet.

**Hesprs is where ERD-aware rendering belongs.** The viewer's `nodeComponents` injection point and `BaseModule` extension API are made for what a relational-schema viewer needs: a `dmv-table-node` component that renders a `dmv.table`-tagged text node as a typed column list with PK/FK icons; an `ERDLayout` module for force-directed positioning; a `SchemaSearch` module. The author is responsive, ships fast, and is actively rewriting the API anyway — small upstream contributions land easily. Lowest-effort path: publish a `@datamodelviz/hesprs-erd` companion package (a `nodeComponents` map + module bundle).

**Which to bet on first.** Hesprs in the immediate term (~weeks): the API is the right shape, the maintainer is reachable, and an ERD module pack is a one-weekend project that becomes the reference for "what `.canvas` files of relational schemas should look like." Quartz in the medium term (~quarters): ship a `dmv-quartz-starter` once canvas-page stabilises. Both are MIT, culturally aligned with a CLI-first OSS tool, and neither has a competing ERD offering.

## Sources

**Quartz:**
- [jackyzha0/quartz GitHub repo](https://github.com/jackyzha0/quartz)
- [Quartz philosophy](https://github.com/jackyzha0/quartz/blob/v5/docs/philosophy.md)
- [PR #2295 — feat(v5): add plugin system](https://github.com/jackyzha0/quartz/pull/2295)
- [Issue #927 — Canvas Support](https://github.com/jackyzha0/quartz/issues/927)
- [Issue #628 — Canvas Support? (duplicate)](https://github.com/jackyzha0/quartz/issues/628)
- [Issue #1043 — Excalidraw support](https://github.com/jackyzha0/quartz/issues/1043)
- [PR #1796 — JSON Canvas (closed unmerged)](https://github.com/jackyzha0/quartz/pull/1796)
- [Quartz Community org](https://github.com/quartz-community)
- [`@quartz-community/canvas-page`](https://github.com/quartz-community/canvas-page)
- [Quartz v5 docs site](https://quartz.jzhao.xyz/)
- [Jacky Zhao's site](https://jzhao.xyz)

**Hesprs:**
- [Hesprs/JSON-Canvas-Viewer GitHub repo](https://github.com/Hesprs/JSON-Canvas-Viewer)
- [Hesprs README](https://github.com/Hesprs/JSON-Canvas-Viewer/blob/main/README.md)
- [Modules docs](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/3-%F0%9F%A7%A9-Modules)
- [Develop a Module docs](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/5-%F0%9F%A7%91%E2%80%8D%F0%9F%92%BB-Develop-a-Module)
- [Construction details](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/2-%F0%9F%8F%97%EF%B8%8F-Construction-Details)
- [Release v4.3.0](https://github.com/Hesprs/JSON-Canvas-Viewer/releases/tag/v4.3.0)
- [Hesprs personal site](https://hesprs.github.io)
- [Live demo](https://hesprs.github.io/projects/json-canvas-viewer)

**Cross-references:**
- [JSON Canvas 1.0 spec](https://jsoncanvas.org/spec/1.0/)
- All star counts, release dates, and commit timestamps captured via `gh api` on 2026-05-28.
