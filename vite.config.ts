import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/va-mission-control/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
})
