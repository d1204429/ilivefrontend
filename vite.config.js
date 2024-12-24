import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.js', '.vue', '.json']
  },
  server: {
    port: 8080,
    host: true,
    cors: true,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:1988',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ''),
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url)
          })
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'vue',
            'vue-router',
            'vuex',
            'axios'
          ],
          'styles': [
            '@/assets/styles/main.css',
            '@/assets/styles/variables.scss'
          ]
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({name}) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[ext]/[name]-[hash][extname]'
        }
      }
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2000
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/assets/styles/variables.scss";
          @import "@/assets/styles/mixins.scss";
        `
      }
    },
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'vuex',
      'axios'
    ],
    exclude: ['@fortawesome/fontawesome-free']
  },
  envPrefix: 'VITE_',
  base: '/',
  preview: {
    port: 8080,
    host: true,
    cors: true
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    'process.env': process.env
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
