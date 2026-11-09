import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In production the app is served by Cloudflare Pages and /api/* is handled
// by Pages Functions. In local `vite` dev, requests to /api are proxied to
// `wrangler pages dev` (see README "Local development").
const FUNCTIONS_ORIGIN = process.env.FUNCTIONS_ORIGIN || 'http://localhost:8788';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase') || id.includes('node_modules/@sentry')) return 'supabase';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': { target: FUNCTIONS_ORIGIN, changeOrigin: true },
    },
  },
});
