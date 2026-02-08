import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import TurndownService from 'turndown';
import puppeteer from 'puppeteer';

// Markdown to HTML conversion
export async function markdownToHtml(
  markdown: string,
  options: { includeStyles?: boolean; standalone?: boolean } = {}
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight)
    .use(rehypeSanitize)
    .use(rehypeStringify);

  const file = await processor.process(markdown);
  let html = String(file);

  if (options.standalone) {
    html = wrapInHtmlBoilerplate(html, options.includeStyles ?? true);
  }

  return html;
}

function wrapInHtmlBoilerplate(body: string, includeStyles: boolean): string {
  const styles = includeStyles ? `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        max-width: 900px;
        margin: 40px auto;
        padding: 0 20px;
        line-height: 1.6;
        color: #24292f;
        background-color: #ffffff;
      }
      pre {
        background: #f6f8fa;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        border: 1px solid #d0d7de;
      }
      code {
        background: #f6f8fa;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 85%;
      }
      pre code {
        background: none;
        padding: 0;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
      }
      th, td {
        border: 1px solid #d0d7de;
        padding: 6px 13px;
        text-align: left;
      }
      th {
        background: #f6f8fa;
        font-weight: 600;
      }
      blockquote {
        border-left: 4px solid #d0d7de;
        padding-left: 16px;
        color: #656d76;
        margin: 16px 0;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      input[type="checkbox"] {
        margin-right: 8px;
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
      }
      h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
      h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
      a { color: #0969da; text-decoration: none; }
      a:hover { text-decoration: underline; }
      ul, ol { padding-left: 2em; }
      li { margin-top: 0.25em; }
    </style>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown</title>
  ${styles}
</head>
<body>
  ${body}
</body>
</html>`;
}

// Markdown to PDF conversion
export async function markdownToPdf(
  markdown: string,
  outputPath: string,
  options: { pageSize?: string; includeStyles?: boolean } = {}
): Promise<void> {
  const html = await markdownToHtml(markdown, {
    standalone: true,
    includeStyles: options.includeStyles ?? true
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: (options.pageSize || 'A4') as any,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    printBackground: true,
  });

  await browser.close();
}

// HTML to Markdown conversion
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  // Add custom rules for better conversion
  turndownService.addRule('strikethrough', {
    filter: (node: HTMLElement) => ['DEL', 'S', 'STRIKE'].includes(node.nodeName),
    replacement: (content) => `~~${content}~~`,
  });

  turndownService.addRule('taskList', {
    filter: (node: any) => {
      return node.nodeName === 'INPUT' && node.type === 'checkbox';
    },
    replacement: (_content, node: any) => {
      return node.checked ? '[x] ' : '[ ] ';
    },
  });

  return turndownService.turndown(html);
}

// Strip markdown formatting for plain text export
export function stripMarkdownFormatting(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/~~(.+?)~~/g, '$1') // Remove strikethrough
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
    .replace(/!\[.+?\]\(.+?\)/g, '') // Remove images
    .replace(/^[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/^>\s+/gm, '') // Remove blockquotes
    .replace(/`{1,3}[^`\n]+`{1,3}/g, (match) => match.replace(/`/g, '')) // Remove code backticks
    .replace(/^\s*[-*_]{3,}\s*$/gm, '') // Remove horizontal rules
    .replace(/\|(.+)\|/g, '$1') // Remove table pipes
    .trim();
}
