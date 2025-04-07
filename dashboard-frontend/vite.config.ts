// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use styled-components instead of emotion
      '@mui/styled-engine': '@mui/styled-engine-sc',
    },
  },
  optimizeDeps: {
    include: ['styled-components'],
    force: true,
  },
});

