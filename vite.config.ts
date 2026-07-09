import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      basicSsl(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'icon.png'],
        manifest: {
          name: 'Fimply',
          short_name: 'Fimply',
          description: 'Финансовый трекер',
          theme_color: '#161512',
          background_color: '#161512',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'icon.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    server: {
      https: true,
      proxy: {
        '/api/stt': {
          target: 'https://stt.api.cloud.yandex.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/stt/, '/speech/v1/stt:recognize'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Api-Key ${env.VITE_YANDEX_API_KEY || ''}`);
            });
          },
        },
      },
    },
  };
});
