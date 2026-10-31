import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { host: '127.0.0.1', port: 4318 }, build: { target: 'es2022', rollupOptions: { output: { manualChunks(id) { if (id.includes('/node_modules/')) return 'vendor'; } } } } });
