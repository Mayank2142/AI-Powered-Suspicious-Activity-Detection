import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const sitesWorker: Plugin = {
  name: 'sites-static-worker',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'server/index.js',
      source: `const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") return response;
    const url = new URL(request.url);
    url.pathname = "/";
    return env.ASSETS.fetch(new Request(url, request));
  },
};
export default worker;
`,
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sitesWorker],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
