# Agent surface for datamodelviz: MCP, ACP, or stay CLI-only?

> datamodelviz already ships a CLI (`dmv sqlite-to-canvas`, `dmv dbml-to-canvas`) that emits JSON Canvas 1.0 files. The question for the next phase is what *additional* surface — if any — makes it usable from Claude Code, Cursor, Cline, Aider, Zed and the rest. Five questions, then a recommendation.

## 1. The "share to web" coding-agent-centric Obsidian flow today

The dominant publishing surface is **Quartz** ([jackyzha0/quartz](https://github.com/jackyzha0/quartz), 12.3k stars) — covered in depth in [quartz-and-hesprs.md](./quartz-and-hesprs.md). Two of its properties are what make it agent-friendly:

- **Files in, site out.** Drop markdown (and now `.canvas`) into a folder, push, GitHub Actions builds and deploys. No CMS, no API, no auth dance for an agent to navigate. The standard Quartz GitHub Actions workflow ([gist by aadimator](https://gist.github.com/aadimator/5125fbd8a51b1dd13ba608fe37aacfd4); see also [Gage Lara's CI/CD guide](https://blog.gagelara.com/post/effortless-obsidian-to-quartz-cicd-for-beginners-with-github-actions/)) is fewer than 40 lines.
- **Vault-shaped repo.** A Quartz site *is* an Obsidian vault checked into git. Anything an agent can do to a markdown repo, it can do to a Quartz site.

The competitor, **Obsidian Publish**, is a hosted paid service with no public write API — agent-hostile by construction. Custom static sites (Hugo, Astro, MkDocs) work but require the agent to know the project's specific build glue. Quartz has won by being boring and uniform.

**Has anyone publicly demonstrated "agent picks up a vault → generates canvas → publishes"?** No end-to-end writeup yet. The pieces exist independently: [Building an AI-Powered Knowledge Management System](https://corti.com/building-an-ai-powered-knowledge-management-system-automating-obsidian-with-claude-code-and-ci-cd-pipelines/) shows a Claude-Code-writes-to-vault → push → GitHub Actions pipeline, but for plain markdown, not canvas. The earlier [Claude Code + Obsidian Canvas research](./claude-code-and-obsidian-canvas.md) found *creation* of `.canvas` files is well-trodden but *iteration* and *publication* are not.

**The Quartz v5 canvas-page plugin closes that loop.** [`@quartz-community/canvas-page`](https://github.com/quartz-community/canvas-page) (0 stars, no releases, 69 commits as of 2026-05-28) renders `.canvas` files natively. The installation is `npx quartz plugin add github:quartz-community/canvas-page`. An agent-driven workflow is now mechanically straightforward: agent generates `schema.canvas`, agent commits, Quartz publishes. The friction is that the plugin is brand new and has no agent-targeted docs — the README is for humans installing plugins.

## 2. Obsidian MCP servers — current state

There are at least a dozen Obsidian MCP servers. Ranked by activity and canvas relevance:

| Server | Stars | Lang | Canvas? | Transport |
|---|---|---|---|---|
| [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) | 3.8k | Python | **No** | Local REST API plugin |
| [bitbonsai/mcpvault](https://github.com/bitbonsai/mcpvault) (`@bitbonsai/mcpvault` on npm) | 1.3k | TS | Yes (read-only file ops) | Direct filesystem |
| [iansinnott/obsidian-claude-code-mcp](https://github.com/iansinnott/obsidian-claude-code-mcp) | 292 | TS | No mention | Obsidian plugin, WS/SSE |
| [AgriciDaniel/claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) | 5.7k | (skills+MCP+plugin) | **Yes — `claude-canvas` skill** | Both REST and filesystem |
| [rps321321/obsidian-mcp-pro](https://github.com/rps321321/obsidian-mcp-pro) | 16 | TS | **Yes — read/add nodes/edges** | Direct filesystem |
| [smith-and-web/obsidian-mcp-server](https://github.com/smith-and-web/obsidian-mcp-server) | 16 | TS | No | Direct filesystem |
| [Cam10001110101/mcp-server-obsidian-jsoncanvas](https://github.com/Cam10001110101/mcp-server-obsidian-jsoncanvas) | 13 | Python | **Yes — dedicated canvas server** | Filesystem (stdio or HTTP) |
| [obsidian-api-mcp](https://pypi.org/project/obsidian-api-mcp/) | (PyPI only) | Python | **Yes — `obsidian_canvas_read/write`** | Local REST API plugin |
| [kanishkez/obsidian-mcp](https://github.com/kanishkez/obsidian-mcp) | 4 | Python | No | Local REST API plugin |

The split is roughly two camps:

- **Filesystem-direct** (MCPVault, obsidian-mcp-pro, jsoncanvas, smith-and-web): the MCP server reads the vault folder as files. Obsidian doesn't need to be running. This is the camp doing canvas work.
- **Local REST API bridge** (mcp-obsidian, obsidian-api-mcp): requires the [Local REST API community plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) running inside an open Obsidian instance. Live, but operationally heavier.

**Canvas-aware MCP exists and is decent.** [obsidian-mcp-pro](https://github.com/rps321321/obsidian-mcp-pro) exposes `read_canvas`, `add_canvas_node`, `add_canvas_edge`, `list_canvases`. [Cam10001110101/mcp-server-obsidian-jsoncanvas](https://github.com/Cam10001110101/mcp-server-obsidian-jsoncanvas) is dedicated to canvas with `create_canvas`, `edit_canvas`, `validate_canvas`, `export_canvas`. [obsidian-api-mcp](https://pypi.org/project/obsidian-api-mcp/) has coarse-grained `obsidian_canvas_read`/`obsidian_canvas_write` that explicitly handle text/file/link/group nodes.

**None of these have star counts that imply real adoption** — the canvas-aware servers all sit below 20 stars. The only Obsidian MCP server with mass adoption (MarkusPfundstein, 3.8k) has zero canvas support. That gap is meaningful: it means the *current* Obsidian-via-MCP user base mostly doesn't reach for canvases.

## 3. ACP (Agent Client Protocol) — what is it, who uses it, is it real?

**Canonical URL:** [agentclientprotocol.com](https://agentclientprotocol.com/) — the [zed-industries/agent-client-protocol](https://github.com/zed-industries/agent-client-protocol) repo (3.2k stars, Apache-2.0, latest v0.13.4 on 2026-05-27) is the spec and reference implementations in Kotlin, Java, Python, Rust, TypeScript.

**The slot ACP fills is editor↔agent, not agent↔tool.** Quoting the project: it "standardizes communication between code editors (interactive programs for viewing and editing source code) and coding agents (programs that use generative AI to autonomously modify code)." The analogy everyone uses is LSP: "the LSP for AI coding agents" ([Marc Nuri's introduction](https://blog.marcnuri.com/agent-client-protocol-acp-introduction)). It is JSON-RPC 2.0 over stdio (for local agents) or HTTP/WebSocket (for remote agents), with custom types for things only agents need — like diff display.

**MCP and ACP are orthogonal, not competitive.** MCP gives a running agent more tools. ACP lets an arbitrary editor host an arbitrary agent. A tool author ships MCP servers. An *agent runtime* author ships ACP servers. **datamodelviz is a tool author. ACP is irrelevant for us.**

**Adoption is real but recent.** The [ACP registry launched 2026-01-28](https://zed.dev/blog/acp-registry) and the [zed.dev/acp page](https://zed.dev/acp) now lists ~50 agents (Claude Code via the Claude Agent SDK, Codex CLI, Gemini CLI, Cline, Cursor, GitHub Copilot CLI, Goose, OpenHands, Kimi CLI, OpenCode, Mistral Vibe, etc.) and ~13 clients (Zed, JetBrains, VS Code, Neovim, Emacs, marimo, AionUi, Sidequery, DeepChat, Tidewave, plus an entry for *Obsidian*). [DeepWiki's ACP page for OpenCode](https://deepwiki.com/sst/opencode/7.4-agent-client-protocol-(acp)) and [Kiro's ACP CLI docs](https://kiro.dev/docs/cli/acp/) confirm third-party uptake outside Zed.

**Implication for datamodelviz: none, directly.** But the indirect signal is interesting: if Obsidian itself becomes an ACP client, the natural integration for us would still be "agent invokes `dmv` CLI from inside Obsidian's hosted agent session" — same as today. ACP doesn't change what we ship.

## 4. MCP vs CLI for a project like datamodelviz — when to invest

The clearest framing comes from [CircleCI's MCP-vs-CLI piece](https://circleci.com/blog/mcp-vs-cli/) and [Robert Melton's "Build CLIs First, Wrap as MCPs Second"](https://robertmelton.com/posts/clis-wrap-as-mcps/):

- **Inner loop (write code, run tool, read output, iterate) is CLI territory.** Models are pre-trained on shell semantics; the assistant already knows what `dmv dbml-to-canvas schema.dbml -o schema.canvas` does. CircleCI cites a benchmark where CLI achieved 33% better token efficiency and a 77 vs. 60 task-completion score versus MCP for the same browser-automation task.
- **Outer loop (multi-system orchestration, shared infra, auth) is MCP territory.** GitHub's, Sentry's, Linear's, Stripe's official MCP servers exist because they front *services* with auth and stateful resources — not because they front CLIs.
- **MCP servers pay a schema-loading tax.** Every connected MCP server's tool descriptions land in context before the assistant has done anything useful. A multi-server agent can burn thousands of tokens just on tool descriptions.
- **The thin-wrapper pattern wins when you do go MCP.** Melton's rule: the CLI does the 50,000 lines of work, the MCP server is a 200-line shim that calls the CLI and reshapes output as JSON. The `gh` CLI is the canonical example — community MCP servers wrap it rather than reimplementing the GitHub API.

**Lowest-effort MCP wrapper paths:**
- [`any-cli-mcp-server`](https://lobehub.com/mcp/eirikb-any-cli-mcp-server) generates MCP tools from `--help` output. Closest to zero effort, lowest fidelity.
- [`cli-mcp` / CLI Wrapper](https://mcpmarket.com/server/cli-wrapper) takes a JSON config of subcommands and produces typed MCP tools.
- A hand-written FastMCP/`@modelcontextprotocol/sdk` server with one tool per `dmv` subcommand — a few hundred lines.
- `claude mcp add --transport stdio dmv -- dmv mcp-serve` — the registration side is one line once the server exists.

**Reasons we'd ship MCP eventually:**
- Discoverability inside `/mcp` listings in Claude Code, Cursor, Zed.
- Structured tool schemas (the agent knows the exact arg names, types, defaults — no `--help` parse failure).
- Mid-conversation invocation without shelling out (less of an issue inside Claude Code, where shell calls are first-class; more of an issue in chat-only clients like Claude Desktop).

**Reasons not to ship MCP yet:**
- Every coding agent in our target list (Claude Code, Cursor, Cline, Aider, Zed) runs shell commands natively. They will invoke `dmv` just fine without an MCP server.
- Maintenance doubles: schema drift between CLI flags and MCP tool params is a real ongoing cost.
- The schema-loading tax is paid by every user, including users who never invoke the tool in a session.
- Our user base is small; the marginal user added by MCP-availability is currently rounding to zero.

## 5. Existing personal workflows for Obsidian + coding agents

Eight writeups, what surface each one actually uses:

1. **[Starmorph — Obsidian + Claude Code: Complete Integration Guide](https://blog.starmorph.com/blog/obsidian-claude-code-integration-guide)** — Five strategies: symlinks (`ln -s ~/vault/notes ./docs`), vault-as-repo with `.obsidianignore`, MCP bridges, Obsidian plugins (Smart Connections, Copilot), QMD+session sync. Quotes a 54× speedup using the Obsidian CLI over `grep` for orphan-note finding. Notes Obsidian's CEO is shipping official Claude Skills to edit `.md`, `.base`, and `.canvas` files. Canvas workflow itself: not detailed.
2. **[Stefan Imhoff — Agentic Note-Taking](https://www.stefanimhoff.de/writing/agentic-note-taking-obsidian-claude-code/)** — Pure CLI: *"I taught Claude Code to use the `qmd` and `obsidian` commands to manage my vault."* No MCP, no symlinks, no canvas. Vault in place, `CLAUDE.md` for context.
3. **[Curiouslychase — AI-Native Obsidian Vault Setup Guide](https://curiouslychase.com/posts/ai-native-obsidian-vault-setup-guide/)** — Bun scripts + slash commands in `000 OS/Claude/commands/`. No MCP, no canvas.
4. **[Corti.com — AI-Powered Knowledge Management](https://corti.com/building-an-ai-powered-knowledge-management-system-automating-obsidian-with-claude-code-and-ci-cd-pipelines/)** — n8n + Claude API + MCP bridge. Pattern: *Trigger → Read CLAUDE.md → Read vault content → Call Claude API → Write output.* Canvas: not mentioned.
5. **[Geeky Gadgets — Set up an Obsidian Vault for Claude Code Automation](https://www.geeky-gadgets.com/obsidian-vault-claude-workflow/)** — Vault-as-working-directory pattern. CLI, no MCP.
6. **[Simon Späti — Quartz Publish Obsidian Vault](https://www.ssp.sh/brain/quartz-publish-obsidian-vault/)** — Publishing-focused, no agent integration.
7. **[Dev.to — Building Claude Skills That Connect to Obsidian](https://dev.to/scorp323/building-claude-skills-that-connect-to-obsidian-a-developers-field-guide-4a2k)** — Claude Code Skills (not MCP) for vault operations including canvas creation.
8. **[Wenhao — Obsidian Canvas Automation Guide](https://blog.wenhaofree.com/en/posts/articles/obsidian-skills-canvas-integration-guide/)** — Claude Code Skill that creates canvases from prompts. Cited in the earlier canvas research for *creation*; iteration is hand-done.

**Pattern across all eight:** when the surface is named, it's almost always **CLI plus skills/slash-commands**, occasionally MCP, rarely both. The serious canvas work (#7, #8) is happening in **Claude Code Skills** — markdown files with prompts, not MCP servers.

**Confirming the earlier finding:** `.canvas`-aware *iteration* loops are essentially absent from public writeups. The earlier [Claude Code + Obsidian Canvas research](./claude-code-and-obsidian-canvas.md) called this an open gap; nothing in this second pass refutes it.

## Recommendation for datamodelviz

**Ship CLI-only for now. Add a thin MCP wrapper when — and only when — a second user asks for it.**

Three reasons.

*Every agent we want to support already invokes CLIs natively.* Claude Code, Cursor, Cline, Aider, and Zed all spawn shells as a primary loop. `dmv dbml-to-canvas` works in all of them today with zero new code from us. Shipping MCP buys us discoverability inside `/mcp` lists and saves the agent a `--help` round-trip — that's it. Neither justifies the maintenance tax for a one-person project with single-digit users.

*The MCP ecosystem for our adjacent space is thin and unproven.* The Obsidian MCP servers that *do* support canvas (obsidian-mcp-pro, Cam10001110101's jsoncanvas server, obsidian-api-mcp) all sit below 20 stars. The 3.8k-star Obsidian MCP doesn't touch canvases. If canvas-via-MCP had pull, someone would have built it bigger by now. There is no MCP-shaped audience waiting for us.

*The thin-wrapper path is cheap *later* and expensive *now*.* When the time comes, `claude mcp add --transport stdio dmv -- dmv mcp-serve` plus a ~200-line FastMCP shim mapping our existing subcommands to MCP tools is a weekend. Doing it before we have product-market fit on the CLI surface means we maintain two argument-parsing layers, two doc sets, and two schema-drift risks while the CLI is still evolving.

The single concrete next investment, per the [Quartz/Hesprs research](./quartz-and-hesprs.md), is a **`dmv-quartz-starter`** template repo: sample DBML, GitHub Actions step that runs `dmv dbml-to-canvas`, Quartz v5 with canvas-page enabled, published demo. That's the agent-friendly surface that actually ships value today — an agent clones the template, edits the DBML, pushes, gets a hosted data model. No MCP required, no ACP required, the existing CLI does the work.

## Sources

**MCP servers for Obsidian:**
- [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian)
- [bitbonsai/mcpvault](https://github.com/bitbonsai/mcpvault) — also [mcp-obsidian.org](https://mcp-obsidian.org/)
- [iansinnott/obsidian-claude-code-mcp](https://github.com/iansinnott/obsidian-claude-code-mcp)
- [AgriciDaniel/claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian)
- [rps321321/obsidian-mcp-pro](https://github.com/rps321321/obsidian-mcp-pro)
- [smith-and-web/obsidian-mcp-server](https://github.com/smith-and-web/obsidian-mcp-server)
- [Cam10001110101/mcp-server-obsidian-jsoncanvas](https://github.com/Cam10001110101/mcp-server-obsidian-jsoncanvas)
- [obsidian-api-mcp on PyPI](https://pypi.org/project/obsidian-api-mcp/)
- [kanishkez/obsidian-mcp](https://github.com/kanishkez/obsidian-mcp)
- [Obsidian Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api)

**ACP:**
- [Agent Client Protocol homepage](https://agentclientprotocol.com/)
- [zed-industries/agent-client-protocol repo](https://github.com/zed-industries/agent-client-protocol)
- [Zed ACP page (agents and clients list)](https://zed.dev/acp)
- [ACP Registry launch — 2026-01-28](https://zed.dev/blog/acp-registry)
- [Marc Nuri — ACP, the LSP for AI coding agents](https://blog.marcnuri.com/agent-client-protocol-acp-introduction)
- [OpenCode ACP on DeepWiki](https://deepwiki.com/sst/opencode/7.4-agent-client-protocol-(acp))
- [Kiro CLI ACP docs](https://kiro.dev/docs/cli/acp/)

**MCP vs CLI:**
- [CircleCI — MCP vs. CLI for AI-native development](https://circleci.com/blog/mcp-vs-cli/)
- [Robert Melton — Build CLIs First, Wrap as MCPs Second](https://robertmelton.com/posts/clis-wrap-as-mcps/)
- [any-cli-mcp-server](https://lobehub.com/mcp/eirikb-any-cli-mcp-server)
- [CLI Wrapper on mcpmarket](https://mcpmarket.com/server/cli-wrapper)
- [FastMCP × Claude Code integration](https://gofastmcp.com/integrations/claude-code)
- [Claude Code MCP CLI reference](https://code.claude.com/docs/en/cli-reference)

**Quartz + agents:**
- [@quartz-community/canvas-page](https://github.com/quartz-community/canvas-page)
- [Quartz GitHub Actions gist](https://gist.github.com/aadimator/5125fbd8a51b1dd13ba608fe37aacfd4)
- [Gage Lara — Effortless Obsidian to Quartz CI/CD](https://blog.gagelara.com/post/effortless-obsidian-to-quartz-cicd-for-beginners-with-github-actions/)

**Personal Obsidian + agent workflows:**
- [Starmorph — Obsidian + Claude Code Integration Guide](https://blog.starmorph.com/blog/obsidian-claude-code-integration-guide)
- [Stefan Imhoff — Agentic Note-Taking](https://www.stefanimhoff.de/writing/agentic-note-taking-obsidian-claude-code/)
- [Curiouslychase — AI-Native Obsidian Vault Setup Guide](https://curiouslychase.com/posts/ai-native-obsidian-vault-setup-guide/)
- [Corti.com — Automating Obsidian with Claude Code and CI/CD](https://corti.com/building-an-ai-powered-knowledge-management-system-automating-obsidian-with-claude-code-and-ci-cd-pipelines/)
- [Geeky Gadgets — Obsidian Vault for Claude Code](https://www.geeky-gadgets.com/obsidian-vault-claude-workflow/)
- [Simon Späti — Quartz Publish Obsidian Vault](https://www.ssp.sh/brain/quartz-publish-obsidian-vault/)
- [Dev.to — Building Claude Skills That Connect to Obsidian](https://dev.to/scorp323/building-claude-skills-that-connect-to-obsidian-a-developers-field-guide-4a2k)
- [Wenhao — Obsidian Canvas Automation with Claude Code Skills](https://blog.wenhaofree.com/en/posts/articles/obsidian-skills-canvas-integration-guide/)

**Internal cross-references:**
- [research/quartz-and-hesprs.md](./quartz-and-hesprs.md)
- [research/claude-code-and-obsidian-canvas.md](./claude-code-and-obsidian-canvas.md)

All star counts, release dates, and tool inventories captured 2026-05-28.
