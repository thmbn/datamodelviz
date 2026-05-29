# Sharing JSON Canvas (`.canvas`) on the open web

> Captured 2026-05-29. How to publish a `.canvas` file produced by datamodelviz (or any JSON Canvas source) to an open-source web frontend without Obsidian. Confirms the Hesprs deep-dive in [quartz-and-hesprs.md](quartz-and-hesprs.md) as the dominant option and surfaces three credible alternatives plus the official apps registry.

## TL;DR

The open [JSON Canvas 1.0 spec](https://jsoncanvas.org/spec/1.0/) was designed for this exact use case. Five concrete paths exist; one is the default, three are framework-specific alternatives, and one is the "stay in Obsidian for the export step" option:

| Path | Best for | Stars | Maturity |
|---|---|---|---|
| [Hesprs/JSON-Canvas-Viewer](https://github.com/Hesprs/JSON-Canvas-Viewer) | Default — framework-agnostic, CDN-droppable | ~63 | 8 releases since Jan 2026 |
| [Digital-Tvilling/react-jsoncanvas](https://github.com/Digital-Tvilling/react-jsoncanvas) | React projects (alternative to Hesprs's adapter) | 121 | No releases; 51 commits on main |
| [wujieli0207/vue-json-canvas](https://github.com/wujieli0207/vue-json-canvas) | Vue 3 projects (alternative to Hesprs's adapter) | 28 | No releases; 14 commits |
| [lovettbarron/rehype-jsoncanvas](https://github.com/lovettbarron/rehype-jsoncanvas) | Inline rendering inside markdown-based sites (MDX, Astro, Eleventy) | (low) | Listed in official registry |
| [Obsidian Webpage HTML Export](https://github.com/KosmosisDire/obsidian-webpage-export) | Static export from inside Obsidian | (n/a) | Obsidian-side, output is plain HTML |

All four web libraries are registered in the [official JSON Canvas apps registry](https://jsoncanvas.org/docs/apps/) — the canonical discovery surface.

## 5-minute embed (Hesprs chimp via CDN)

The fastest way to put a `.canvas` on the web — no build step, no install, just an HTML file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Canvas</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <script type="module">
    import { JSONCanvasViewer, parser, fetchCanvas } from 'https://unpkg.com/json-canvas-viewer';

    new JSONCanvasViewer({
      container: document.body,
      canvas: await fetchCanvas('path/to/your-file.canvas'),
      parser, // handles markdown in text nodes — required for datamodelviz output
    });
  </script>
</body>
</html>
```

Host the HTML + the `.canvas` file on GitHub Pages, Vercel, Netlify, Cloudflare Pages, or any static host. Done.

Optional modules (minimap, controls, debug panel, mistouch-preventer) are tree-shakeable imports per [Hesprs's modules docs](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/3-%F0%9F%A7%A9-Modules).

## Options landscape

### Hesprs/JSON-Canvas-Viewer — default pick

Framework-agnostic TypeScript, ~63 stars but **eight releases since Jan 2026** — the most mature option despite the modest star count. Adapters for React (`@json-canvas-viewer/react`), Vue (`@json-canvas-viewer/vue`), Preact, and a Vite plugin; plus the "chimp" zero-install variant used in the snippet above. Full deep dive — including maintainer responsiveness, extension API, and architectural opinions — lives in [`research/quartz-and-hesprs.md`](quartz-and-hesprs.md).

### Digital-Tvilling/react-jsoncanvas

**121 stars, MIT, TypeScript.** React + TS app that renders nodes and edges from `.canvas`. **No releases published as of 2026-05-29** (51 commits on `main`). Star count outpaces release cadence, suggesting hobby/exploration usage rather than production polish. Pick this only if you specifically want a React-only codebase with no broader runtime — otherwise Hesprs's official React adapter is the safer choice.

### wujieli0207/vue-json-canvas

**28 stars, MIT, Vue 3.** 14 commits, no releases. Earliest-stage option in this list. Same advice as the React option: prefer Hesprs's Vue adapter for production unless you have a specific reason to use a Vue-only codebase.

### lovettbarron/rehype-jsoncanvas

The interesting one if your site is **markdown-driven** (MDX, Astro, Eleventy with Rehype, Next.js with `next-mdx-remote`). Renders the canvas inline inside a markdown page rather than as a standalone viewer. Lower star count but the only option that doesn't require a separate viewer container — the canvas becomes another block in the document flow alongside code samples, images, etc.

### Obsidian Webpage HTML Export plugin

The "I want to stay in Obsidian for the export step" option. Generates standalone HTML per canvas, so the *hosting* side has no dependency on Obsidian. The export side does require an Obsidian session, which makes this a poor fit for headless / CI / agent workflows (the entire reason datamodelviz exists) but a fine fit for someone hand-curating a canvas in Obsidian and wanting a quick public artifact.

## Discovery: the official apps registry

[jsoncanvas.org/docs/apps/](https://jsoncanvas.org/docs/apps/) is the canonical registry. Beyond the web viewers above, it lists:

- **Native apps**: Obsidian (storage + import + export), Kinopio, Flowchart Fun, hi-canvas, OrgPad, Charkoal
- **Language bindings**: Dart, Go, Python, Ruby, Rust, TypeScript

Worth bookmarking — anything that supports the format gets listed there.

## Implications for datamodelviz

Three concrete moves:

1. **Pull the chimp/CDN snippet into the repo as a recipe.** Currently the README only tells users to "drop the `.canvas` into Obsidian" or "clone Hesprs and run it locally" — both heavier than needed. A one-page `examples/web-viewer.html` checked in alongside `examples/demo.canvas` would let anyone do `python3 -m http.server` (or just open the file directly with `?canvas=demo.canvas` query-param wiring) and see the demo in a browser without an install. **Lowest-effort, highest-leverage addition.**

2. **Submit datamodelviz to the apps registry once we ship npm-publish.** Per [design.md §11.1](../spec/design.md#111-publish-to-npm), `npm publish` is a 10-minute job blocked only on having a first external user. Once that lands, datamodelviz qualifies as a "conversion tool" for [jsoncanvas.org/docs/apps/](https://jsoncanvas.org/docs/apps/) — free discoverability for exactly the right audience.

3. **The Rehype angle is the answer for docs-site integration.** If a user wants to embed a data model inside an MDX / Astro / Eleventy docs site, `rehype-jsoncanvas` is the path — no React or Vue runtime required, no separate viewer page. Worth a one-line mention in the [Skill](../skills/visualize-data-model/SKILL.md) and README as the right answer when someone asks "how do I put this in my docs site?"

## Sources

- [JSON Canvas 1.0 spec](https://jsoncanvas.org/spec/1.0/)
- [Official apps registry](https://jsoncanvas.org/docs/apps/)
- [Hesprs/JSON-Canvas-Viewer](https://github.com/Hesprs/JSON-Canvas-Viewer) — primary recommendation
- [Hesprs viewer Modules docs](https://github.com/Hesprs/JSON-Canvas-Viewer/wiki/3-%F0%9F%A7%A9-Modules)
- [Digital-Tvilling/react-jsoncanvas](https://github.com/Digital-Tvilling/react-jsoncanvas)
- [wujieli0207/vue-json-canvas](https://github.com/wujieli0207/vue-json-canvas)
- [lovettbarron/rehype-jsoncanvas](https://github.com/lovettbarron/rehype-jsoncanvas)
- [Obsidian Webpage HTML Export plugin](https://github.com/KosmosisDire/obsidian-webpage-export)

**Internal cross-references:**
- [research/quartz-and-hesprs.md](quartz-and-hesprs.md) — full Hesprs deep dive
- [research/claude-code-and-obsidian-canvas.md](claude-code-and-obsidian-canvas.md) — iteration / plugin landscape
- [research/agent-surface-mcp-acp-cli.md](agent-surface-mcp-acp-cli.md) — agent-flow context

Star counts and registry contents captured 2026-05-29 via direct fetches.
