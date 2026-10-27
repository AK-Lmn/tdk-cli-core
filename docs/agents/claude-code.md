# Use Flisk with Claude Code

[← Back to the README](../../README.md#pick-your-agent)

<table>
<tr><td><a href="claude-code.md"><img src="../assets/agents/tabs/claude-code-selected.svg" alt="Claude Code (selected)" height="44"></a><a href="codex.md"><img src="../assets/agents/tabs/codex.svg" alt="Codex" height="44"></a><a href="cursor.md"><img src="../assets/agents/tabs/cursor.svg" alt="Cursor" height="44"></a><img src="../assets/agents/tabs/rest.svg" alt="" height="44"></td></tr>
<tr><td>

**1. Install Claude Code and Flisk**

```bash
curl -fsSL https://claude.ai/install.sh | bash
npm install -g @flisk-sh/flisk
```

Windows: `irm https://claude.ai/install.ps1 | iex`. Also available with `brew install --cask claude-code` or `npm install -g @anthropic-ai/claude-code`.

**2. Paste the prompt**

```text
Build me a small online shop with a storefront and an orders API, and run it on my laptop with Flisk.
```

**3. Skills and instructions.** `flisk project` writes the Flisk skills to `.claude/skills/`, which Claude Code loads. It also writes an `AGENTS.md`. Claude Code reads that only when the project has no `CLAUDE.md`, so if you have one, add the line `@AGENTS.md` to it.

**4. Optional: connect Flisk as an MCP server**, so the agent can start the stack, check status and restart services through Flisk tools instead of shell commands.

```bash
claude mcp add --scope project flisk -- flisk mcp
```

This writes `.mcp.json` in the project. Claude Code asks you to approve project servers before it uses them:

```json
{ "mcpServers": { "flisk": { "command": "flisk", "args": ["mcp"] } } }
```

Docs: [setup](https://code.claude.com/docs/en/setup) · [MCP](https://code.claude.com/docs/en/mcp) · [memory](https://code.claude.com/docs/en/memory) · [skills](https://code.claude.com/docs/en/skills)

</td></tr>
</table>

---

Using a different agent? Pick its tab above. Any other agent that can run terminal commands works too. Point it at `AGENTS.md`, or connect it to `flisk mcp`, which runs an MCP server over stdio.
