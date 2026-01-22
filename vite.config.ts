import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 어떤 라이브러리에서 호출하든 루트 폴더의 React를 사용하도록 강제
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    // 의존성 사전 빌드 시 R3F 핵심 라이브러리 포함
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
  },
  build: {
    // 에러를 유발하던 manualChunks 설정을 제거하여 단일 참조 체인 유지
    sourcemap: false,
    outDir: 'dist',
  }
})