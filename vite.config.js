import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import net from 'node:net'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function backendAutoStartPlugin() {
  let backendProcess = null

  return {
    name: 'backend-auto-start',
    configureServer(server) {
      const isPortInUse = (port, host = '127.0.0.1') => {
        return new Promise((resolve) => {
          const socket = new net.Socket()
          socket.setTimeout(800)
          socket.once('connect', () => {
            socket.destroy()
            resolve(true)
          })
          socket.once('timeout', () => {
            socket.destroy()
            resolve(false)
          })
          socket.once('error', () => {
            socket.destroy()
            resolve(false)
          })
          socket.connect(port, host)
        })
      }

      const launchBackend = async () => {
        const inUse = await isPortInUse(5000)
        if (inUse) {
          console.log('\x1b[36m[SyncDoc] Backend server is already running on port 5000.\x1b[0m')
          return
        }

        console.log('\x1b[33m[SyncDoc] Backend server not detected on port 5000. Launching automatically...\x1b[0m')
        const serverScript = path.resolve(__dirname, 'server', 'src', 'server.js')
        const serverCwd = path.resolve(__dirname, 'server')

        backendProcess = spawn(process.execPath, [serverScript], {
          cwd: serverCwd,
          stdio: 'inherit',
          env: { ...process.env },
        })

        backendProcess.on('error', (err) => {
          console.error('\x1b[31m[SyncDoc] Failed to auto-launch backend server:\x1b[0m', err)
        })

        backendProcess.on('exit', (code, signal) => {
          if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
            console.warn(`\x1b[33m[SyncDoc] Backend server exited (code: ${code}, signal: ${signal}).\x1b[0m`)
          }
          backendProcess = null
        })
      }

      launchBackend()

      const stopBackend = () => {
        if (backendProcess && !backendProcess.killed) {
          console.log('\x1b[36m[SyncDoc] Stopping backend server...\x1b[0m')
          try {
            backendProcess.kill()
          } catch {}
          backendProcess = null
        }
      }

      server.httpServer?.once('close', stopBackend)
      process.once('exit', stopBackend)
      process.once('SIGINT', () => {
        stopBackend()
        process.exit(0)
      })
      process.once('SIGTERM', () => {
        stopBackend()
        process.exit(0)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), backendAutoStartPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
})


