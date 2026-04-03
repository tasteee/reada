/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        outDir: './dist',
        lib: {
            entry: {
                'core/index': path.resolve(__dirname, 'src/core/index.ts'),
                'react/index': path.resolve(__dirname, 'src/react/index.ts')
            },
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => {
                const extension = format === 'es' ? 'js' : 'cjs'
                return `${entryName}.${extension}`
            }
    },
        minify: 'terser',
        terserOptions: {
            keep_classnames: true,
            keep_fnames: true,
            format: {
                comments: /^!/
            }
    },
        rollupOptions: {
            external: ['react', 'react-dom', 'immer', 'just-safe-get', 'just-safe-set']
        }
    },
    test: {
        globals: true,
        environment: 'jsdom'
    },
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, 'src') },
            { find: '@@', replacement: path.resolve(__dirname) }
        ]
    }
})
