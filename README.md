# Markdown Editor MCP App

A full-featured markdown editor built as a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) app. It renders an interactive UI inside MCP-compatible hosts like Claude Desktop, providing a professional editing experience with live preview, file operations, and export capabilities.

## Features

### Editor
- **Monaco Editor** - The same editor that powers VS Code
- Markdown syntax highlighting
- Line numbers, word wrap, and code folding
- Auto-save (every 30 seconds when a file path is set)
- Unsaved changes warning on close
- Keyboard shortcuts (Ctrl+S / Cmd+S to save)
- Real-time cursor position tracking
- Minimap for large documents

### Live Preview
- **Instant updates** as you type
- **GitHub Flavored Markdown (GFM)** support:
  - Tables with horizontal scrolling
  - Task lists (checkboxes)
  - Strikethrough
  - Autolinks
- Syntax-highlighted code blocks via Prism
- Safe HTML rendering with XSS protection (rehype-sanitize)

### File Operations
- **New** - Create a new document (with unsaved changes prompt)
- **Open** - Load markdown files from disk
- **Save** - Save to current file (with automatic backup)
- **Save As** - Save to a new location

### Export
- **HTML** - Standalone HTML with GitHub-style CSS
- **PDF** - Generate PDF documents (A4, Letter, Legal) via Puppeteer
- **Plain Text** - Strip all markdown formatting

### Import
- **HTML to Markdown** - Convert HTML files to markdown (via Turndown)

### User Interface
- **Split-pane layout** - Editor on left, preview on right
- **Resizable divider** - Drag to adjust pane sizes (20%-80% range)
- **Dark theme** - VS Code-inspired dark color scheme
- **Status bar** - Word count, character count, line count, cursor position
- **Toolbar** - Dropdown menus for export and import

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Host (e.g. Claude Desktop)         │
│                                                             │
│  ┌──────────────────────┐     ┌──────────────────────────┐  │
│  │    MCP Server         │◄───►│    React Client (UI)      │  │
│  │    (Node.js/stdio)    │     │    (Monaco + Preview)     │  │
│  │                       │     │                           │  │
│  │  - edit_markdown      │     │  - Editor (Monaco)        │  │
│  │  - open_file          │     │  - Preview (react-md)     │  │
│  │  - save_file          │     │  - Toolbar                │  │
│  │  - export_html/pdf    │     │  - SplitPane              │  │
│  │  - import_html        │     │  - Status Bar             │  │
│  └──────────────────────┘     └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

The server registers a UI resource (`ui://markdown-editor/app`) and tools that reference it via `_meta`. When the host calls a tool like `edit_markdown`, it renders the React client inside an iframe. The client communicates with the server through the MCP Apps protocol (`@modelcontextprotocol/ext-apps`).

## Prerequisites

- **Node.js** 18+ and npm
- **An MCP-compatible host** that supports MCP Apps (e.g. Claude Desktop)
- **Chromium/Chrome** (optional, only needed for PDF export via Puppeteer)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/markdown-editor-mcp-app.git
cd markdown-editor-mcp-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

This creates:
- `dist/server/` - Compiled MCP server (Node.js)
- `dist/client/` - Built React application (static files)

## Configuring the MCP Server

Register the MCP server with your host so it can discover and launch the editor.

### Claude Desktop

Add to your Claude Desktop MCP settings (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "markdown-editor": {
      "command": "node",
      "args": ["/absolute/path/to/markdown-editor-mcp-app/dist/server/index.js"]
    }
  }
}
```

> Replace `/absolute/path/to/` with the actual absolute path to your project.

### Development Mode (with tsx)

For development, you can run the TypeScript source directly:

```json
{
  "mcpServers": {
    "markdown-editor": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/absolute/path/to/markdown-editor-mcp-app/server/index.ts"
      ]
    }
  }
}
```

### Other MCP Hosts

The server communicates via **stdio** (standard input/output). Run:

```bash
node /absolute/path/to/markdown-editor-mcp-app/dist/server/index.js
```

## Usage

### Opening the Editor

Once the MCP server is configured, ask your AI assistant:

```
Open the markdown editor
```

Or with initial content:

```
Open the markdown editor with this content: # My Document
```

The `edit_markdown` tool accepts these parameters:

| Parameter  | Type   | Description                           |
|-----------|--------|---------------------------------------|
| `content` | string | Initial markdown content (optional)   |
| `filePath`| string | Path to a markdown file to open (optional) |
| `title`   | string | Document title (optional)             |

### Editor Workflow

1. **Create/Open** - Click "New" to start fresh, or "Open" to load an existing `.md` file
2. **Edit** - Write markdown in the left pane (Monaco Editor)
3. **Preview** - See live-rendered output in the right pane
4. **Save** - Press Ctrl+S or click "Save" (creates a `.backup` of the original)
5. **Export** - Use the Export dropdown for HTML, PDF, or Plain Text
6. **Import** - Use the Import dropdown to convert HTML files to markdown

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save file |
| `Ctrl+F` / `Cmd+F` | Find in editor |
| `Ctrl+H` / `Cmd+H` | Find and replace |

### Supported Markdown Syntax

**CommonMark**: Headers, bold, italic, links, images, lists, code blocks, blockquotes, horizontal rules.

**GitHub Flavored Markdown**:

Tables:

```markdown
| Tables    | Are       | Supported |
|-----------|-----------|-----------|
| cell 1    | cell 2    | cell 3    |
```

Task lists:

```markdown
- [ ] Unchecked task
- [x] Checked task
```

Other:

```markdown
~~Strikethrough text~~
```

Fenced code blocks with syntax highlighting:

````markdown
```javascript
// Syntax-highlighted code blocks
const hello = "world";
```
````

## MCP Tools Reference

### `edit_markdown`

Opens the markdown editor UI. This is the primary tool, visible to both the AI model and the app.

| Parameter  | Type     | Required | Description                    |
|-----------|----------|----------|--------------------------------|
| `content` | `string` | No       | Initial markdown content       |
| `filePath`| `string` | No       | Path to markdown file to open  |
| `title`   | `string` | No       | Document title                 |

### `open_file`

Opens a markdown file from disk and returns its content.

| Parameter  | Type     | Required | Description           |
|-----------|----------|----------|-----------------------|
| `filePath`| `string` | Yes      | Path to file to open  |

### `save_file`

Saves markdown content to disk with optional backup.

| Parameter      | Type      | Required | Default | Description                       |
|---------------|-----------|----------|---------|-----------------------------------|
| `filePath`    | `string`  | Yes      | -       | Path to save the file             |
| `content`     | `string`  | Yes      | -       | Markdown content to save          |
| `createBackup`| `boolean` | No       | `true`  | Create backup of existing file    |

### `create_file`

Creates a new markdown file. Fails if the file already exists.

| Parameter  | Type     | Required | Default | Description       |
|-----------|----------|----------|---------|-------------------|
| `filePath`| `string` | Yes      | -       | Path for new file |
| `content` | `string` | No       | `""`    | Initial content   |

### `export_html`

Converts markdown to a standalone HTML file with GitHub-style CSS.

| Parameter       | Type      | Required | Default | Description                  |
|----------------|-----------|----------|---------|------------------------------|
| `content`      | `string`  | Yes      | -       | Markdown content to export   |
| `outputPath`   | `string`  | Yes      | -       | Path for HTML output         |
| `includeStyles`| `boolean` | No       | `true`  | Include CSS styles           |
| `standalone`   | `boolean` | No       | `true`  | Include full HTML boilerplate|

### `export_pdf`

Generates a PDF from markdown using Puppeteer (headless Chrome).

| Parameter       | Type      | Required | Default | Description                    |
|----------------|-----------|----------|---------|--------------------------------|
| `content`      | `string`  | Yes      | -       | Markdown content to export     |
| `outputPath`   | `string`  | Yes      | -       | Path for PDF output            |
| `pageSize`     | `string`  | No       | `"A4"`  | Page size: `A4`, `Letter`, `Legal` |
| `includeStyles`| `boolean` | No       | `true`  | Include CSS styles             |

### `export_text`

Strips all markdown formatting and exports as plain text.

| Parameter    | Type     | Required | Description                |
|-------------|----------|----------|----------------------------|
| `content`   | `string` | Yes      | Markdown content to export |
| `outputPath`| `string` | Yes      | Path for text output       |

### `import_html`

Reads an HTML file and converts it to markdown using Turndown.

| Parameter  | Type     | Required | Description            |
|-----------|----------|----------|------------------------|
| `filePath`| `string` | Yes      | Path to HTML file      |

## Security

- **Path Sanitization** - All file paths are resolved and checked against an allowlist (user home directory and `/tmp`) to prevent directory traversal
- **Filename Sanitization** - Filenames are sanitized to remove special characters
- **File Size Limits** - Maximum 10 MB per file to prevent memory exhaustion
- **XSS Protection** - Preview HTML is sanitized via `rehype-sanitize`
- **Atomic Writes** - Files are written to a temp file first, then renamed, preventing corruption from interrupted writes
- **Automatic Backups** - Original files are backed up before overwriting (when `createBackup` is true)

## Development

### Scripts

| Script             | Description                                    |
|-------------------|------------------------------------------------|
| `npm run dev`     | Start server + client in watch mode            |
| `npm run dev:server` | Start only the MCP server (with tsx watch)  |
| `npm run dev:client` | Start only the Vite dev server (port 3000)  |
| `npm run build`   | Build server + client for production           |
| `npm run typecheck` | Run TypeScript type checking                 |
| `npm run preview` | Preview production client build                |

### Project Structure

```
markdown-editor-mcp-app/
├── server/                      # MCP Server (Node.js + TypeScript)
│   ├── index.ts                 # Entry point - creates McpServer, registers resource & tools
│   ├── tools/
│   │   ├── editor-tools.ts      # edit_markdown tool
│   │   ├── file-tools.ts        # open_file, save_file, create_file
│   │   ├── export-tools.ts      # export_html, export_pdf, export_text
│   │   └── import-tools.ts      # import_html, import_rtf (placeholder)
│   └── utils/
│       ├── file-io.ts           # Secure file I/O with path sanitization
│       └── converters.ts        # Markdown <-> HTML <-> PDF conversions
├── client/                      # React App (rendered in MCP host iframe)
│   ├── index.html               # HTML entry point
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Main app component + MCP app integration
│   ├── components/
│   │   ├── Editor.tsx           # Monaco Editor wrapper
│   │   ├── Preview.tsx          # Markdown preview (react-markdown)
│   │   ├── SplitPane.tsx        # Resizable split pane layout
│   │   └── Toolbar.tsx          # File operations toolbar
│   ├── hooks/
│   │   └── useMarkdownEditor.ts # Editor state management hook
│   └── styles/
│       └── app.css              # Global styles (dark theme)
├── package.json
├── tsconfig.json                # Shared TypeScript config
├── tsconfig.server.json         # Server-specific TS config (emits JS)
└── vite.config.ts               # Vite config with chunk splitting
```

### Tech Stack

| Layer       | Technology                                                      |
|------------|------------------------------------------------------------------|
| Protocol   | `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`  |
| Server     | Node.js, TypeScript, Zod                                        |
| Client     | React 18, TypeScript, Vite                                      |
| Editor     | Monaco Editor (`@monaco-editor/react`)                          |
| Markdown   | unified, remark-parse, remark-gfm, remark-rehype               |
| Preview    | react-markdown, react-syntax-highlighter, rehype-sanitize       |
| Conversion | Turndown (HTML->MD), Puppeteer (MD->PDF)                        |
| File I/O   | fs-extra, sanitize-filename                                     |

## Troubleshooting

### MCP Server Not Starting

1. Ensure you've built the project: `npm run build`
2. Verify the path in your MCP config is **absolute** and points to `dist/server/index.js`
3. Test manually: `node /path/to/dist/server/index.js` (should print to stderr and wait for stdio input)
4. Check your MCP host's logs for connection errors

### PDF Export Fails

Puppeteer requires a Chromium installation. If it fails:

```bash
# macOS
brew install chromium

# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# Or let Puppeteer download its own:
npx puppeteer browsers install chrome
```

### File Operations Denied

File operations are restricted to:
- Your **home directory** (`~`)
- **`/tmp`** and the system temp directory

If you get "Access denied", ensure the file path is within these directories.

### Large File Performance

Files over 10 MB are rejected. For large documents, the preview may lag due to re-rendering on every keystroke. Consider splitting large documents into smaller files.

## License

MIT

## Acknowledgments

- Built with the [Model Context Protocol](https://modelcontextprotocol.io)
- Editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Markdown processing by [unified](https://unifiedjs.com/)
