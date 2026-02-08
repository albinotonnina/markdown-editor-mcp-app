import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          'markdown': ['react-markdown', 'remark-gfm', 'rehype-raw'],
          'syntax-highlighter': ['react-syntax-highlighter'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  optimizeDeps: {
    include: ['@modelcontextprotocol/ext-apps'],
  },
});
