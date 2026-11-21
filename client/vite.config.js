import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // host:true binds to your LAN too, so a phone on the same Wi-Fi
    // can open the app at http://<your-pc-ip>:5173
    host: true,
    // In development, any request to /api is forwarded to the Express server.
    // This means the browser sees ONE origin -> no CORS pain, cookies just work.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
