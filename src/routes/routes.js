import express from 'express'
import pkg from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import qrImage from 'qrcode'
import cors from 'cors'
import { message } from './message.js'
import { selectWppParametros, updateEstado, updateQrCode } from '../models/wpp_parametros.js'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { initialize } from '../configuration/database/database_methods.js'
const { LocalAuth, Client } = pkg

const app = express()
const port = process.env.PORT || 3000
const address = process.env.NODE_ENV === 'production' ? 'wpp' : 'wpd'
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.json({}))

let clients = {}
const SESSION_PATH = path.join(process.cwd(), '.wwebjs_auth')
const MAX_QR_ATTEMPTS = 5

function stopClients() {
  Object.values(clients).forEach(async (client) => {
    try {
      await client.destroy()
      console.log(`❌ Cliente detenido: ${client.authStrategy.clientId}`)
    } catch (error) {
      console.error('Error deteniendo cliente:', error)
    }
  })
}

async function rebootClients() {
  console.log('🔄 Iniciando REBOOT de clientes...')
  await stopClients()
  deleteSessionFolder()
  await initializeClients()
  console.log('🚀 Reboot completado.')
}

function deleteSessionFolder() {
  try {
    if (fs.existsSync(SESSION_PATH)) {
      fs.rmSync(SESSION_PATH, { recursive: true, force: true })
      console.log('🗑️ Sesiones eliminadas correctamente.')
    }
  } catch (error) {
    console.error('❌ Error eliminando sesiones:', error)
  }
}

async function deleteSession(clientId) {
  const sessionDir = path.join(SESSION_PATH, `session-${clientId}`)
  try {
    if (clients[clientId]) {
      await clients[clientId].destroy();
      delete clients[clientId];
    }

    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, {recursive: true, force: true})
      console.log(`🗑️ Sesión eliminada: ${clientId}`)
    }
  } catch (error) {
    console.error(`❌ Error eliminando sesión de ${clientId}:`, error)
  }
}

async function handleClientDisconnected(clientId) {
  try {
    console.log(`⚠️ Cliente desconectado: ${clientId}`);
    await deleteSession(clientId);
    delete clients[clientId];

    // Agregar un pequeño retraso antes de reiniciar la sesión
    setTimeout(async () => {
      await initializeClients();
    }, 5000);
  } catch (error) {
    console.error(`❌ Error al manejar la desconexión de ${clientId}:`, error);
  }
}

async function initializeClients() {
  try {
    const clientes = await selectWppParametros()

    if (!clientes || clientes.length === 0) {
      console.log('⚠️ No hay clientes activos en la base de datos')
      return
    }
    stopClients()
    clients = {}

    clientes.forEach((cliente) => {
      const clientId = cliente.ID
      let qrAttempts = 0

      clients[clientId] = new Client({
        authStrategy: new LocalAuth({ clientId }),
        puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      })

      clients[clientId].on('qr', async (qr) => {
        if (qrAttempts >= MAX_QR_ATTEMPTS) {
          console.log(`❌ Máximo de intentos de QR alcanzado para el cliente ${clientId}`)
          await updateEstado(3, `MAX_QR_ATTEMPTS_REACHED`, clientId)
          return
        }
        qrAttempts++
        console.log(`Escanea este QR con tu WhatsApp (${cliente.TELEFONO} - ${clientId}):`)
        qrcode.generate(qr, { small: true })
        const qrBuffer = await qrImage.toBuffer(qr)
        await updateEstado(0, `ESPERANDO QR`, clientId)
        await updateQrCode(qrBuffer, clientId)
      })

      clients[clientId].on('ready', async () => {
        console.log(`✅ Cliente listo: ${cliente.TELEFONO} (${clientId})`)
        await updateEstado(1, `LISTO`, clientId)
      })

      clients[clientId].on('disconnected', async (reason) => {
        console.log(`❌ Cliente desconectado (${clientId}): ${reason}`)
        await updateEstado(3, `DESCONECTADO, ${reason}`, clientId)
        await handleClientDisconnected(clientId)
      })

      try {
        clients[clientId].initialize()
      } catch (error) {
        console.error(`❌ Error iniciando cliente ${clientId}:`, error)
        handleClientDisconnected(clientId)
      }
    })
  } catch (error) {
    console.error('Error inicializando clientes:', error)
  }
}

app.get(`/${address}/reload-clients`, async (req, res) => {
  await initializeClients()
  res.json({ message: 'Clientes recargados desde la BD' })
})

app.get(`/${address}/reboot`, async (req, res) => {
  await rebootClients()
  res.json({ message: 'Reboot completado: sesiones eliminadas y clientes reiniciados' })
})

app.use(`/${address}/message`, message)

app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}, address: ${address}`)
})

initialize().then(() => initializeClients())

export { clients }