import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Override with VITE_BASE_PATH when the GitHub repository name changes.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/melasma/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
