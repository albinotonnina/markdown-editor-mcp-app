import fs from 'fs-extra';
import path from 'path';
import sanitize from 'sanitize-filename';
import { fileURLToPath } from 'url';
import os from 'os';

// Allowed directories for file operations
const ALLOWED_BASE_PATHS = [
  os.homedir(),
  '/tmp',
  path.join(os.tmpdir()),
];

export function sanitizeFilePath(filePath: string): string {
  const resolved = path.resolve(filePath);

  // Check if path is within allowed directories
  const isAllowed = ALLOWED_BASE_PATHS.some(basePath =>
    resolved.startsWith(path.resolve(basePath))
  );

  if (!isAllowed) {
    throw new Error(`Access denied: ${filePath} is outside allowed directories`);
  }

  // Sanitize filename
  const dir = path.dirname(resolved);
  const filename = sanitize(path.basename(resolved));

  return path.join(dir, filename);
}

export async function readFileSecure(filePath: string): Promise<string> {
  const safePath = sanitizeFilePath(filePath);

  // Check file exists and is readable
  const stats = await fs.stat(safePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }

  // Limit file size (10MB)
  if (stats.size > 10 * 1024 * 1024) {
    throw new Error('File too large (max 10MB)');
  }

  return fs.readFile(safePath, 'utf-8');
}

export async function writeFileSecure(filePath: string, content: string): Promise<void> {
  const safePath = sanitizeFilePath(filePath);

  // Ensure directory exists
  await fs.ensureDir(path.dirname(safePath));

  // Write atomically (write to temp, then rename)
  const tempPath = `${safePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, safePath);
}
