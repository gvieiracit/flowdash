# Claude Code Concepts Reference

A comprehensive guide to understanding Skills, Subagents, Commands, and Plugins in Claude Code.

---

## Mental Model

| Concept | What It Is | Analogy |
|---------|-----------|---------|
| **Skill** | Reusable prompt/instructions | A recipe card |
| **Subagent** | Isolated worker with own context | A contractor you hire for a job |
| **Slash Command** | Way to invoke things with `/` | A keyboard shortcut |
| **Plugin** | Bundle of skills + agents + tools | An app you install |

---

## How They Relate

```
┌─────────────────────────────────────────────────────┐
│  PLUGIN (distribution package)                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │   Skill    │ │  Subagent  │ │ MCP Server │      │
│  └────────────┘ └────────────┘ └────────────┘      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  SLASH COMMAND (/name)                              │
│  • Built-in: /help, /cost, /compact                 │
│  • Custom: Any skill you invoke with /skill-name    │
└─────────────────────────────────────────────────────┘
```

---

## Skills vs Subagents

| Aspect | Skill | Subagent |
|--------|-------|----------|
| **Context** | Runs in your conversation | Runs in isolated context |
| **Output** | Inline (you see everything) | Returns summary only |
| **Use case** | Instructions, workflows | Heavy/parallel work |

---

## Decision Tree

```
What do you want to do?
│
├─► Teach Claude a workflow or convention?
│   └─► Create a SKILL
│       └─► Should Claude auto-use it?
│           ├─► Yes → Just add description
│           └─► No  → Add disable-model-invocation: true
│
├─► Run isolated/parallel work?
│   └─► Use a SUBAGENT (via context: fork in skill)
│
├─► Share across team/projects?
│   └─► Create a PLUGIN
│
└─► Just invoke something manually?
    └─► It's a SLASH COMMAND (which is just a skill)
```

---

## Detailed Breakdown

### 1. Skills (Custom Commands)

**What it is:** Reusable prompts and instructions stored as `SKILL.md` files in `.claude/skills/` directory.

**Key characteristics:**
- Contain instructions, templates, and supporting files
- Can be invoked manually with `/skill-name` or automatically when relevant
- Run in your **main conversation context** (inline execution)
- Can include arguments: `/skill-name argument1 argument2`
- Support dynamic context injection with shell commands

**When to use:**
- Reference content (conventions, patterns, domain knowledge)
- Task automation (deployments, commits, code generation)
- Reusable workflows you want across projects
- Personal or project-specific customizations

**Directory structure:**
```
.claude/skills/<skill-name>/SKILL.md
```

**Location determines scope:**

| Location | Path | Scope |
|----------|------|-------|
| **Personal** (Global) | `~/.claude/skills/<skill-name>/SKILL.md` | All your projects |
| **Project** | `.claude/skills/<skill-name>/SKILL.md` | Current project only |

---

### 2. Subagents (Task Tool with Agent Types)

**What it is:** Specialized AI assistants that run in **isolated contexts** with their own system prompts, tool access, and permissions.

**Key characteristics:**
- Run in a **separate context window** (not your main conversation)
- Can have restricted tool access and custom permission modes
- Automatic delegation based on task description matching
- Can run in foreground (blocking) or background (concurrent)
- Each subagent has a custom system prompt
- Cannot spawn other subagents (no nested delegation)

**Built-in subagents:**
- **Explore**: Fast, read-only agent for codebase exploration
- **Plan**: Research agent for plan mode
- **General-purpose**: Capable agent for complex multi-step tasks
- **Bash**: Separate context for terminal commands

**When to use:**
- Tasks that produce verbose output you don't want in main context
- Operations requiring specific tool restrictions
- Self-contained work that can return a summary
- Running parallel investigations
- Isolating high-volume operations (tests, logs, data processing)

---

### 3. Slash Commands (Built-in vs Custom)

**What it is:** Shortcuts you can invoke with `/command-name` syntax.

**Built-in commands:**
- `/help` - Get usage help
- `/compact` - Compress conversation
- `/cost` - Track token usage
- `/context` - Visualize context usage
- `/plan` - Enter plan mode
- `/agents` - Manage subagents

**Custom commands:**
- Created as skills with `disable-model-invocation: true`
- Invoke with `/skill-name`
- Can accept arguments: `/fix-issue 123`

**The relationship:** Custom slash commands are just skills that you manually invoke instead of letting Claude decide when to use them.

---

### 4. Plugins (MCP Servers and Skill Bundles)

**What it is:** Packaged collections of skills, agents, hooks, and MCP servers that can be shared across projects and teams.

**Key characteristics:**
- Live in their own directory with a `.claude-plugin/plugin.json` manifest
- Can bundle multiple skills, agents, hooks, and MCP servers
- Skills are namespaced: `/plugin-name:skill-name`
- Can be distributed through marketplaces
- Installed with `/plugin install`

**Plugin structure:**
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          (manifest with name, version)
├── skills/                  (Agent skills)
│   └── review/SKILL.md
├── agents/                  (Custom subagents)
│   └── code-reviewer.md
├── hooks/                   (Event handlers)
│   └── hooks.json
└── .mcp.json               (MCP server configurations)
```

**When to use:**
- Sharing functionality with teams
- Distributing reusable extensions
- Bundling related skills and agents together
- Version control and easy updates

---

## Comparison Matrix

| Feature | Skills | Subagents | Slash Commands | Plugins |
|---------|--------|-----------|----------------|---------|
| **Execution Context** | Main conversation | Isolated context | Either | None - distributes components |
| **Invocation** | Manual `/name` or auto | Auto delegation | Manual with `/` | Install once, components work |
| **Visibility** | In main context | Separate window | Listed with `/` | Namespaced components |
| **Tool Access** | Inherit main permissions | Custom restrictions | Inherit main | Depends on component |
| **Shareability** | Manual copy or via plugin | Manual copy or via plugin | Manual copy or via plugin | Via marketplace (easy) |
| **Model Override** | Yes (via `model:` field) | Yes (via `model:` field) | No | Depends on component |

---

## Creating Skills

### Basic Skill (runs inline)

```yaml
# .claude/skills/review/SKILL.md
---
name: review
description: Review code changes
---

Review the current PR for bugs and style issues.
```

### Skill with Subagent (isolated execution)

```yaml
# .claude/skills/deep-research/SKILL.md
---
name: deep-research
description: Research a topic thoroughly
context: fork          # Makes it run as subagent
agent: Explore
---

Research $ARGUMENTS and return findings.
```

### Manual-only Command

```yaml
---
name: deploy
disable-model-invocation: true  # Only runs when you type /deploy
---

Deploy to production...
```

### Skill with Arguments

```yaml
---
name: fix-issue
description: Fix a GitHub issue
---

Fix GitHub issue $ARGUMENTS following our coding standards.
```

Invoke: `/fix-issue 123`

---

## Available Variables in Skills

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking |
| `$ARGUMENTS[N]` | Specific argument by index (0-based) |
| `$N` | Shorthand for `$ARGUMENTS[N]` |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `` !`command` `` | Execute shell command, output replaces placeholder |

---

## Frontmatter Options

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | No | Display name (lowercase, hyphens). Defaults to directory name |
| `description` | Recommended | What the skill does. Claude uses this to auto-invoke |
| `argument-hint` | No | Hint for autocomplete, e.g., `[issue-number]` |
| `disable-model-invocation` | No | `true` = manual only, prevents auto-invoke |
| `user-invocable` | No | `false` = hide from `/` menu (background knowledge) |
| `allowed-tools` | No | Tools without permission prompts |
| `model` | No | Override the model for this skill |
| `context` | No | `fork` = run in isolated subagent |
| `agent` | No | Subagent type when `context: fork` (Explore, Plan, general-purpose) |

---

## TL;DR

- **Skill** = prompt template (can be auto or manual)
- **Subagent** = isolated worker (use `context: fork` in a skill)
- **Slash command** = any skill you invoke with `/`
- **Plugin** = package to share skills/agents/tools
