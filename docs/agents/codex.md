# Use Flisk with Codex

[← Back to the README](../../README.md#pick-your-agent)

<table>
<tr><td><a href="claude-code.md"><img src="../assets/agents/tabs/claude-code.svg" alt="Claude Code" height="44"></a><a href="codex.md"><img src="../assets/agents/tabs/codex-selected.svg" alt="Codex (selected)" height="44"></a><a href="cursor.md"><img src="../assets/agents/tabs/cursor.svg" alt="Cursor" height="44"></a><img src="../assets/agents/tabs/rest.svg" alt="" height="44"></td></tr>
<tr><td>

**1. Install Codex and Flisk**

```bash
npm install -g @openai/codex
npm install -g @flisk-sh/flisk
```

Also available with `curl -fsSL https://chatgpt.com/codex/install.sh | sh` or `brew install --cask codex`.

**2. Paste the prompt**

```text
Build me a small online shop with a storefront and an orders API, and run it on my laptop with Flisk.
```

**3. Skills and instructions.** Codex reads the `AGENTS.md` and the skills in `.agents/skills/` that `flisk project` writes.

**4. Optional: connect Flisk as an MCP server**, so the agent can start the stack, check status and restart services through Flisk tools instead of shell commands.

```bash
codex mcp add flisk -- flisk mcp
```

Or add it by hand to `~/.codex/config.toml`. A project `.codex/config.toml` works for trusted projects:

```toml
[mcp_servers.flisk]
command = "flisk"
args = ["mcp"]
```

Docs: [CLI](https://learn.chatgpt.com/docs/codex/cli.md) · [MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) · [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md.md) · [skills](https://learn.chatgpt.com/docs/build-skills.md)

</td></tr>
</table>

---

Using a different agent? Pick its tab above. Any other agent that can run terminal commands works too. Point it at `AGENTS.md`, or connect it to `flisk mcp`, which runs an MCP server over stdio.
