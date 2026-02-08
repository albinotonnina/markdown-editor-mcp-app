#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps';

// Import tool registration functions
import { registerEditorTool } from './tools/editor-tools.js';
import { registerFileTools } from './tools/file-tools.js';
import { registerExportTools } from './tools/export-tools.js';
import { registerImportTools } from './tools/import-tools.js';

// Create MCP server instance
const server = new McpServer({
  name: 'markdown-editor',
  version: '1.0.0',
});

// Register app resource (UI)
server.registerResource(
  'markdown-editor-app',
  'ui://markdown-editor/app',
  {
    description: 'Full-featured markdown editor with live preview, supports CommonMark and GitHub Flavored Markdown',
    mimeType: RESOURCE_MIME_TYPE,
  },
  async () => ({
    contents: [{
      uri: 'ui://markdown-editor/app',
      mimeType: RESOURCE_MIME_TYPE,
      text: '',
    }],
  })
);

// Register all tools
registerEditorTool(server);
registerFileTools(server);
registerExportTools(server);
registerImportTools(server);

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Markdown Editor MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
