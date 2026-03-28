# WeClaw Client

> A cross-platform AI assistant desktop application with autonomous Agent execution, intelligent chat, workflow automation, skill library, and tool management — all in one.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-25-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## Feature Overview

### 🤖 Claw Agent (Core)

The flagship feature of WeClaw — an **autonomous AI Agent** with an OpenClaw-like architecture. Simply describe your goal in plain language and Claw will:

1. **Plan**: Ask the AI to break the goal into 3–8 executable steps (structured JSON output)
2. **Execute**: Drive the AI step-by-step, passing cross-step context throughout
3. **Automate**: Parse code blocks in AI output and automatically create files or run terminal commands

**Supported Step Types:**

| Type | Description |
|------|-------------|
| `think` | Analysis, reasoning, planning |
| `search` | Search and information retrieval |
| `write` | Writing, document/content generation |
| `code` | Code generation (auto file creation + command execution) |
| `file` | File operations (auto file creation) |
| `api` | API calls, data fetching |
| `summarize` | Aggregate and summarize results |
| `custom` | Other custom operations |

**Automated Actions:**
- **`write-file`**: When AI output contains ` ```write-file path\ncontent``` ` → file is created automatically
- **`exec-command`**: When AI output contains ` ```bash\ncommand``` ` → command is executed in the terminal automatically

---

### 💬 AI Chat

- Multi-session management: create, switch, delete conversations with persistent storage
- Support for image and file attachments (drag-and-drop / paste)
- Quick commands: Summarize, Translate, Explain, Write Code, Optimize
- Skill injection: apply skills from the library directly in chat
- Output panel: code plan, to-do list, and file preview in a unified sidebar

---

### 🔀 Workflow Automation

- Visual canvas editor with drag-and-drop node connections
- Multiple trigger modes: manual, scheduled (Cron), file change, API call, Webhook
- Rich node types: AI chat, conditional branch, file operation, code execution, task creation, notification, data processing, and more
- Workflow version management and execution history

---

### 🧩 Skill Library

- Create, edit, and delete custom prompt-based skills
- Category management: Productivity / Coding / Writing / Analysis / Communication / Custom
- Import from local JSON files or community-shared skill packages via URL
- Skills can be injected into Claw Agent's planning System Prompt to influence AI strategy

---

### 🔧 Tool Management

- Define tools the AI can call (Built-in / Script / API types)
- Fine-grained permission control: read-only / read-write / disabled
- Parameterized configuration supporting Shell, Python, Node.js scripts and custom APIs
- Tools can be referenced directly in workflow nodes

---

### 📋 Task Management

- Kanban-style task view (Pending / In Progress / Completed / Cancelled)
- Priority levels (Low / Medium / High / Critical), assignees, due dates, estimated hours
- Tags, notes, and dependency linking
- Task statistics overview

---

### 📊 Dashboard

- Token usage stats (today / cumulative / remaining quota)
- Quick summary: conversation count, workflow count, task count, history count
- Quick access to all modules (Workflow / Tasks / Chat / History / Skills / Tools)

---

### 🔑 Model Configuration

Configure and switch between multiple AI models. Supported out of the box:

| Provider | Example Models |
|----------|---------------|
| OpenAI-compatible | GPT-4, custom endpoints |
| DeepSeek | deepseek-chat (default) |
| Qwen (Alibaba) | qwen-max, etc. |
| Ernie (Baidu) | ERNIE-Bot, etc. |
| Spark (iFlytek) | spark-desk, etc. |
| Zhipu AI | GLM-4, etc. |

---

### 🏢 Workspace

- Set a secure working directory — all file operations are restricted to this path
- Built-in path permission test tool to verify access in real time
- Operations outside the workspace are blocked and logged automatically

---

### 📜 Operation History

- Full audit log of all operations: chat, file access, permission checks, model switches, workspace changes
- Paginated browsing, keyword search, type filtering
- Scheduled sync: interval mode or Cron expression, supporting Bearer Token / Basic Auth / API Key authentication
- Auto-trimmed to the most recent 500 entries

---

### 🔒 Security

- **File write blacklist**: Blocks writes to `/System`, `/usr`, `/bin`, `C:\Windows`, and other system directories
- **Command execution blacklist**: Blocks dangerous commands such as `rm -rf /`, `format`, `mkfs`, Fork Bomb
- **Workspace isolation**: File operations are only allowed within the active workspace directory
- **Local data storage**: All settings and history are stored locally as JSON — nothing is uploaded to the cloud
- **API keys**: Securely stored in local configuration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Electron 25 |
| Frontend | React 18 + TypeScript 5 |
| Styling | Tailwind CSS 3 + Headless UI |
| Icons | Heroicons |
| Routing | React Router DOM 6 |
| Markdown Rendering | react-markdown + remark-gfm |
| Code Highlighting | react-syntax-highlighter + Prism.js |
| Validation | Zod |
| Build Tool | Vite 4 |
| Packaging | electron-builder 24 |
| Data Storage | Local JSON files (no database required) |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install & Run

```bash
# Clone the repository
git clone <repository-url>
cd weclaw-client

# Install dependencies
npm install

# Start in development mode (launches Renderer + Electron main process)
npm run dev
```

### Build & Package

```bash
# macOS (.dmg)
npm run package:mac

# Windows (.exe / NSIS)
npm run package:win

# Build only (no packaging)
npm run build
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build (Renderer + Electron main process) |
| `npm run package:mac` | Package macOS installer |
| `npm run package:win` | Package Windows installer |
| `npm run lint` | Run ESLint code checks |

---

## Project Structure

```
weclaw-client/
├── electron/                # Electron main process
│   ├── main.ts             # Main entry (IPC handlers, AI API calls, file ops)
│   ├── preload.js          # Preload script (exposes IPC to renderer)
│   └── tsconfig.json       # Electron TypeScript config
├── src/                     # Frontend renderer process
│   ├── pages/              # Page components
│   │   ├── Claw.tsx        # Claw Agent page (core, ~104 KB)
│   │   ├── Chat.tsx        # AI chat page
│   │   ├── Dashboard.tsx   # Dashboard
│   │   ├── Tasks.tsx       # Task management kanban
│   │   ├── WorkflowEnhanced.tsx  # Workflow canvas
│   │   ├── SkillManager.tsx      # Skill library manager
│   │   ├── ToolManager.tsx       # Tool manager
│   │   ├── ModelConfig.tsx       # Model configuration
│   │   ├── WorkspaceManager.tsx  # Workspace manager
│   │   ├── HistoryViewer.tsx     # Operation history
│   │   ├── Settings.tsx          # App settings
│   │   └── Login.tsx             # Login / Register
│   ├── components/         # Reusable components
│   │   ├── chat/           # Chat-related components
│   │   ├── dashboard/      # Dashboard sub-components
│   │   ├── skills/         # Skill library components
│   │   ├── tools/          # Tool management components
│   │   ├── workflow/       # Workflow canvas components
│   │   └── history/        # History components
│   ├── contexts/           # React Contexts (Settings / Model / Workspace / Task)
│   ├── types/              # TypeScript types (incl. claw.ts Agent types)
│   ├── utils/              # Utilities (storage / tokenLogger / clawStorage, etc.)
│   ├── App.tsx             # Root component (route config)
│   └── main.tsx            # Renderer entry (includes global ErrorBoundary)
├── dist/                   # Build output
├── package.json
├── vite.config.ts
└── README.md
```

---

## Usage Guide

### 1. Configure an AI Model

1. Click **Models** in the sidebar → **Add Model**
2. Enter model name, type (DeepSeek / OpenAI / Qwen, etc.), API endpoint, and API key
3. Check **Set as Default** and save

### 2. Use Claw Agent

1. Click **Claw** in the sidebar
2. Type your goal (e.g., *Write a Python scraper to collect data from xxx and save it as CSV*)
3. Press `Ctrl+Enter` to submit — Claw will plan and execute automatically
4. Watch the generated files appear in the right-side panel in real time

### 3. Set Up a Workspace

1. Click **Workspace** in the sidebar → **Set Workspace**
2. Choose a local directory — files created by Claw will be saved here
3. Use the **Permission Test Tool** to verify that a path is within the workspace

### 4. Manage Skills

1. Click **Skills** in the sidebar to create or import skills
2. Activate skills in the Claw / Chat page — the AI will refer to skill content when planning
3. Import community-shared skill packs from JSON files

### 5. Configure History Sync

1. Click **History** in the sidebar → **Scheduled Sync**
2. Set server URL and authentication (Bearer Token / Basic Auth / API Key)
3. Configure sync schedule (interval in minutes or Cron expression)

---

## Internationalization

Supports **Simplified Chinese (default)** and **English**. Switch in **Settings → Application Settings → Language**.

Translations are embedded in `src/contexts/SettingsContext.tsx`, covering all UI text across every page and component.

---

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

[MIT License](LICENSE)

---

> **Note:** WeClaw Client is an actively developed project. We recommend backing up important data before use. When Claw Agent executes commands automatically, ensure your workspace is configured correctly to avoid unintended modifications to system directories.
