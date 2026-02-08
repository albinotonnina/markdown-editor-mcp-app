import { z } from 'zod';
import path from 'path';
import fs from 'fs-extra';
import { readFileSecure, writeFileSecure, sanitizeFilePath } from '../utils/file-io.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RESOURCE_URI_META_KEY } from '@modelcontextprotocol/ext-apps';

const RESOURCE_URI = 'ui://markdown-editor/app';

export function registerFileTools(server: McpServer) {
  // Tool for opening files
  server.registerTool(
    'open_file',
    {
      description: 'Open a markdown file from disk',
      inputSchema: {
        filePath: z.string().describe('Path to file to open'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      try {
        const safePath = sanitizeFilePath(args.filePath);
        const content = await readFileSecure(safePath);

        return {
          content: [{ type: 'text' as const, text: `Opened file: ${safePath}` }],
          structuredContent: {
            content,
            filePath: safePath,
            fileName: path.basename(safePath),
          },
          _meta: {
            [RESOURCE_URI_META_KEY]: RESOURCE_URI,
          },
        };
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
  );

  // Save file tool
  server.registerTool(
    'save_file',
    {
      description: 'Save markdown content to disk',
      inputSchema: {
        filePath: z.string().describe('Path to save the file'),
        content: z.string().describe('Markdown content to save'),
        createBackup: z.boolean().default(true).describe('Create a backup of existing file'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      try {
        const safePath = sanitizeFilePath(args.filePath);

        // Create backup if file exists and backup is requested
        if (args.createBackup && await fs.pathExists(safePath)) {
          await fs.copy(safePath, `${safePath}.backup`);
        }

        await writeFileSecure(safePath, args.content);

        return {
          content: [{ type: 'text' as const, text: `Saved to: ${safePath}` }],
          structuredContent: { success: true, filePath: safePath },
          _meta: {
            [RESOURCE_URI_META_KEY]: RESOURCE_URI,
          },
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true,
        };
      }
    }
  );

  // Create new file tool
  server.registerTool(
    'create_file',
    {
      description: 'Create a new markdown file',
      inputSchema: {
        filePath: z.string().describe('Path for the new file'),
        content: z.string().default('').describe('Initial content'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      try {
        const safePath = sanitizeFilePath(args.filePath);

        // Check if file already exists
        if (await fs.pathExists(safePath)) {
          return {
            content: [{
              type: 'text' as const,
              text: `File already exists: ${safePath}`
            }],
            isError: true,
          };
        }

        await writeFileSecure(safePath, args.content);

        return {
          content: [{ type: 'text' as const, text: `Created file: ${safePath}` }],
          structuredContent: { success: true, filePath: safePath },
          _meta: {
            [RESOURCE_URI_META_KEY]: RESOURCE_URI,
          },
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error creating file: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true,
        };
      }
    }
  );
}
