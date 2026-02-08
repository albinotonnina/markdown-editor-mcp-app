import { z } from 'zod';
import { readFileSecure, sanitizeFilePath } from '../utils/file-io.js';
import { htmlToMarkdown } from '../utils/converters.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RESOURCE_URI_META_KEY } from '@modelcontextprotocol/ext-apps';

const RESOURCE_URI = 'ui://markdown-editor/app';

export function registerImportTools(server: McpServer) {
  // Import from HTML
  server.registerTool(
    'import_html',
    {
      description: 'Import HTML file and convert to markdown',
      inputSchema: {
        filePath: z.string().describe('Path to HTML file to import'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      try {
        const safePath = sanitizeFilePath(args.filePath);
        const html = await readFileSecure(safePath);
        const markdown = htmlToMarkdown(html);

        return {
          content: [{ type: 'text' as const, text: `Imported HTML from: ${safePath}` }],
          structuredContent: {
            content: markdown,
            originalPath: safePath,
          },
          _meta: {
            [RESOURCE_URI_META_KEY]: RESOURCE_URI,
          },
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error importing HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true,
        };
      }
    }
  );

  // Import from RTF (placeholder for future implementation)
  server.registerTool(
    'import_rtf',
    {
      description: 'Import RTF file and convert to markdown (requires additional library)',
      inputSchema: {
        filePath: z.string().describe('Path to RTF file to import'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (_args) => {
      return {
        content: [{
          type: 'text' as const,
          text: 'RTF import is not yet implemented. Please convert your RTF file to HTML first, then use the HTML import feature.'
        }],
        isError: true,
      };
    }
  );
}
