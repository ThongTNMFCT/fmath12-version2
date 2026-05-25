import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Đã sửa 'same-origin-allow-popups' thành 'unsafe-none' để hỗ trợ Firebase Auth Popup
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
  // Các cấu hình tối ưu build nếu cần
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  }
});