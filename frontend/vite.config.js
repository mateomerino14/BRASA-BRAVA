import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // La API sirve el build (web y escritorio), así que las rutas de assets son absolutas.
  base: '/',
  server: {
    port: 5173,
    proxy: {'/api': 'http://127.0.0.1:3000'},
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.stories.jsx', 'src/test/**', 'src/main.jsx'],
    },
  },
});
