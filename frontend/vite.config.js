import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            // Local `npm run dev` proxies API calls to the backend container/port.
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
            },
        },
    },
});
