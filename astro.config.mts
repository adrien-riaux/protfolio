import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv } from 'vite';
import type { Connect, ViteDevServer } from 'vite';
import chatHandler from './api/chat.js';

type NodeLikeRequest = IncomingMessage & {
  body?: unknown;
};

type NodeLikeResponse = ServerResponse<IncomingMessage>;

const viteMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = loadEnv(viteMode, process.cwd(), '');
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'static',
  vite: {
    plugins: [
      {
        name: 'portfolio-dev-chat-api',
        configureServer(server: ViteDevServer) {
          server.middlewares.use('/api/chat', (request: IncomingMessage, response: ServerResponse, next: Connect.NextFunction) => {
            if (request.method !== 'POST') {
              next();
              return;
            }

            void chatHandler(request as NodeLikeRequest, response as NodeLikeResponse).catch((error) => {
              console.error('Dev chat handler failed:', error);
              if (!response.headersSent) {
                response.statusCode = 500;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
              }

              response.end(JSON.stringify({ error: 'Local chat handler failed.' }));
            });
          });
        }
      }
    ]
  }
});
