<p align="center">
  <img src="https://raw.githubusercontent.com/badlogic/pi-mono/main/docs/images/logo-auto.svg" width="96" alt="Rz Agent" />
</p>

<h1 align="center">Rz Agent Web</h1>
<p align="center">Minimalist web UI for the <a href="https://github.com/badlogic/pi-mono">pi coding agent</a> — designed for clarity and focus.</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.5-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/pi-0.75.5-3b82f6?style=flat-square" />
  <img src="https://img.shields.io/badge/next-16-000?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## Quick Start

**One command — no install needed:**

```bash
npx pi-web-cn@latest
```

Open [http://localhost:30141](http://localhost:30141).

**Custom port / hostname:**

```bash
pi-web-cn --port 8080
pi-web-cn --hostname 127.0.0.1
pi-web-cn -p 8080 -H 0.0.0.0
```

**Build from source:**

```bash
git clone https://github.com/fxfx4203726-crypto/pi-web-cn.git
cd pi-web-cn
setup.bat          # Windows: auto-install + build + start
# or manually:
npm install && npm run build && npm start
```

---

## Features

- **Session Browser** — Browse all pi sessions grouped by working directory
- **Real-time Chat** — SSE streaming with the agent, live as it thinks
- **Fork Sessions** — Create independent branches from any user message
- **In-session Branching** — Roll back to any node and continue from there
- **Branch Navigator** — Visual tree view to switch between branches
- **Model Switching** — Change models mid-conversation
- **Tool Panel** — Control which tools the agent can use
- **Compaction** — Summarize long conversations to save context window
- **Steer / Follow-up** — Interrupt a running agent, or queue messages after completion
- **File Browser** — IDE-style file tree in the sidebar
- **Dark Mode** — Full light/dark theme with circular wipe transition
- **Chinese Localization** — Fully translated UI

---

## Design Philosophy

Built for clarity. Designed for focus.

- 90% neutral tones + 10% functional accent (Apple Blue `#3B82F6`)
- Diffuse shadows instead of hard borders
- Generous whitespace and breathing room
- System font stack with anti-aliased rendering
- Subtle geometric background texture

---

## Prerequisites

- **Pi coding agent** installed and configured (`@earendil-works/pi-coding-agent`)
- Session files stored at `~/.pi/agent/sessions/`
- Models configured in `models.json`

Override the data directory:

```bash
PI_CODING_AGENT_DIR=/custom/path pi-web-cn
```

---

## Development

```bash
git clone https://github.com/fxfx4203726-crypto/pi-web-cn.git
cd pi-web-cn
npm install
npm run dev      # dev server on :30141
npm run build    # production build
npm start        # serve production build
```

### Project Structure

```
app/
  api/
    sessions/         # Session CRUD + context building
    agent/            # Agent commands + SSE event stream
    files/            # File content reader
    models/           # Model listing + default model
    models-config/    # models.json read/write
    skills/           # Skill search + install
components/           # React UI components
lib/
  session-reader.ts   # .jsonl session file parser
  rpc-manager.ts      # AgentSession lifecycle manager
  normalize.ts        # Tool-call field normalization
hooks/                # Custom React hooks
```

---

## Credits

- Built on [@agegr/pi-web](https://github.com/agegr/pi-web)
- Powered by [pi coding agent](https://github.com/badlogic/pi-mono)

---

<p align="center"><sub>Built for clarity. Designed for focus.</sub></p>
