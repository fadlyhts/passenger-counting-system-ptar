import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Change from './' to '/'
  server: {
    port: 3000,
    host: true, // Allow external connections
    strictPort: true // Exit if port 3000 is not available
  },
  build: {
    outDir: 'build',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'terser',
    target: 'es2015', // Better browser compatibility
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
