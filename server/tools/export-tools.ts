import { z } from 'zod';
import { writeFileSecure, sanitizeFilePath } from '../utils/file-io.js';
import { markdownToHtml, markdownToPdf, stripMarkdownFormatting } from '../utils/converters.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RESOURCE_URI_META_KEY } from '@modelcontextprotocol/ext-apps';

const RESOURCE_URI = 'ui://markdown-editor/app';

export function registerExportTools(server: McpServer) {
  // Export to HTML
  server.registerTool(
    'export_html',
    {
      description: 'Export markdown to HTML file',
      inputSchema: {
        content: z.string().describe('Markdown content to export'),
        outputPath: z.string().describe('Path for the output HTML file'),
        includeStyles: z.boolean().default(true).describe('Include CSS styles'),
        standalone: z.boolean().default(true).describe('Include HTML boilerplate'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      try {
        const safePath = sanitizeFilePath(args.outputPath);
        const html = await markdownToHtml(args.content, {
          includeStyles: args.includeStyles,
          standalone: args.standalone,
        });

        await writeFileSecure(safePath, html);

        return {
          content: [{ type: 'text' as const, text: `Exported HTML to: ${safePath}` }],
          structuredContent: { success: true, path: safePath },
          _meta: {
            [RESOURCE_URI_META_KEY]: RESOURCE_URI,
          },
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error exporting HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true,
        };
      }
    }
  );

  // Export to PDF
  server.registerTool(
    'export_pdf',
    {
      description: 'Export markdown to PDF file',
      inputSchema: {
        content: z.string().describe('Markdown content to export'),
        outputPath: z.string().describe('Path for the output PDF file'),
        pageSize: z.enum(['A4', 'Letter', 'Legal']).default('A4').describe('PDF page size'),
        includeStyles: z.boolean().default(true).describe('Include CSS styles'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      try {
        const safePath = sanitizeFilePath(args.outputPath);

        await markdownToPdf(args.content, safePath, {
          pageSize: args.pageSize,
          includeStyles: args.includeStyles,
        });

        return {
          content: [{ type: 'text' as const, text: `Exported PDF to: ${safePath}` }],
          structuredContent: { success: true, path: safePath },
          _meta: {
            [RESOURCE_URI_META_KEY]: RESOURCE_URI,
          },
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error exporting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true,
        };
      }
    }
  );

  // Export to plain text
  server.registerTool(
    'export_text',
    {
      description: 'Export markdown as plain text (strip formatting)',
      inputSchema: {
        content: z.string().describe('Markdown content to export'),
        outputPath: z.string().describe('Path for the output text file'),
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args) => {
      try {
        const safePath = sanitizeFilePath(args.outputPath);
        const plainText = stripMarkdownFormatting(args.content);

        await writeFileSecure(safePath, plainText);

        return {
          content: [{ type: 'text' as const, text: `Exported plain text to: ${safePath}` }],
          structuredContent: { success: true, path: safePath },
          _meta: {
            [RESOURCE_URI_META_KEY]: RESOURCE_URI,
          },
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error exporting text: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true,
        };
      }
    }
  );
}
