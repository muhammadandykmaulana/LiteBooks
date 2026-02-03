import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pastikan base ini sesuai dengan nama repository GitHub Anda
  base: '/LiteBooks/', 
  build: {
    // Menaikkan batas peringatan menjadi 1000 kB (1 MB) agar tidak terlalu sensitif
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Konfigurasi manual untuk memecah (split) kode menjadi file-file kecil
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Memisahkan library Markdown yang berat ke chunk 'markdown-libs'
            if (id.includes('react-markdown') || id.includes('rehype') || id.includes('remark') || id.includes('micromark')) {
              return 'markdown-libs';
            }
            // Memisahkan library Supabase ke chunk 'supabase-libs'
            if (id.includes('@supabase')) {
              return 'supabase-libs';
            }
            // Library lainnya (seperti React, Lucide) masuk ke 'vendor'
            return 'vendor';
          }
        }
      }
    }
  }
})