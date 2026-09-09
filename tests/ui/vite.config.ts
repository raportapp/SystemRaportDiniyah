import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../../', import.meta.url));
const mock = fileURLToPath(new URL('./context.tsx', import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  publicDir: repo + 'public',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /.*\/hooks\/useAuth$/, replacement: mock },
      { find: /.*\/context\/AppContext$/, replacement: mock },
    ],
  },
  server: { host: '127.0.0.1', port: 3100, fs: { allow: [repo] } },
});
