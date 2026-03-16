import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['recharts'],
  },
  server: {
    port: 3000,
    host: true,
    // Allow access via localhost in normal dev, plus your public domain when reverse-proxied (e.g. via Caddy).
    // If this is too restrictive for your environment, set VITE_ALLOWED_HOSTS="host1,host2,..."
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
      : ['.quantumcue.app', 'localhost', '127.0.0.1', '0.0.0.0'],
    strictPort: true,
    proxy: {
      '/api': {
        // Frontend typically runs in Docker in this repo; reach backend via service DNS.
        // If running outside Docker, you can override via VITE_DEV_PROXY_TARGET.
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
