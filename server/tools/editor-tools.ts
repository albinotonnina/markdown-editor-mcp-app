import { z } from 'zod';
import { readFileSecure } from '../utils/file-io.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RESOURCE_URI_META_KEY } from '@modelcontextprotocol/ext-apps';

const RESOURCE_URI = 'ui://markdown-editor/app';

export function registerEditorTool(server: McpServer) {
  server.registerTool(
    'edit_markdown',
    {
      title: 'Markdown Editor',
      description: 'Full-featured markdown editor with live preview, supports CommonMark and GitHub Flavored Markdown (tables, task lists, syntax highlighting)',
      inputSchema: {
        content: z.string().optional().describe('Initial markdown content to edit'),
        filePath: z.string().optional().describe('Path to markdown file to open'),
        title: z.string().optional().describe('Document title'),
      },
      _meta: {
        ui: { resourceUri: RESOURCE_URI },
      },
    },
    async (args) => {
      let content = args.content || '';

      // If filePath provided, read the file
      if (args.filePath) {
        try {
          content = await readFileSecure(args.filePath);
        } catch (error) {
          return {
            content: [{
              type: 'text' as const,
              text: `Error opening file: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true,
          };
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: `Opening markdown editor${args.filePath ? ` with file: ${args.filePath}` : ''}${args.title ? ` - ${args.title}` : ''}`
        }],
        structuredContent: {
          content,
          filePath: args.filePath,
          title: args.title,
        },
        _meta: {
          [RESOURCE_URI_META_KEY]: RESOURCE_URI,
        },
      };
    }
  );
}
