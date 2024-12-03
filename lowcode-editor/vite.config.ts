import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	esbuild: {
    // 禁用类型检查
    legalComments: 'none',
  },
  plugins: [react()],
})
