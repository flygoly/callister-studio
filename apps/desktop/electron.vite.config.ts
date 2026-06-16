import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const coreAlias = resolve('../../packages/core/src')
const uiAlias = resolve('../../packages/ui/src')
const traceAlias = resolve('../../packages/trace/src')
const providersAlias = resolve('../../packages/providers/src')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@callister/core']
      })
    ],
    resolve: {
      alias: {
        '@callister/core': coreAlias,
        '@callister/core/electron': resolve(coreAlias, 'electron.ts')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@callister/ui': uiAlias,
        '@callister/core': coreAlias,
        '@callister/trace': traceAlias,
        '@callister/providers': providersAlias
      }
    },
    plugins: [react()]
  }
})
