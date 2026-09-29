import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ["dev.ares.uy"],
  },
  build: {
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
  // Silence Bootstrap's Sass deprecation warnings
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          'import',
          'if-function',
          'color-functions',
          'global-builtin',
        ],
      } as object,
    },
  },
})