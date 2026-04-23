import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        create: './create.html',
        vote: './vote.html',
        results: './results.html',
        dashboard: './dashboard.html',
      },
    },
  },
});
