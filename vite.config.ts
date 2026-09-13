import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command }) => ({
  // Project Pages are served from https://<owner>.github.io/GenderGap/.
  base: command === 'build' ? '/russian-partner-calculator/' : '/',
  plugins: [react()],
}));
