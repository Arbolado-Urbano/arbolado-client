import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ["dev.ares.uy"],
  },
  optimizeDeps: {
    exclude: ["maplibre-gl"],
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