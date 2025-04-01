import express from 'express'
import pkg from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import qrImage from 'qrcode'

import cors from 'cors'

import { message } from './message.js'
import {selectWppParametros, updateEstado, updateQrCode} from "../models/wpp_parametros.js";
import * as path from "node:path";
import * as fs from "node:fs";
import {initialize} from "../configuration/database/database_methods.js";
const { LocalAuth, Client } = pkg

const app = express()
const port = process.env.PORT || 3000
const address = process.env.NODE_ENV === 'production' ? 'wpp' : 'wpd'
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.json({}))

// Objeto para almacenar los clientes
let clients = {}
const SESSION_PATH = path.join(process.cwd(), '.wwebjs_auth') // Ruta de sesiones

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
  await stopClients() // Detener clientes
  deleteSessionFolder() // Borrar sesiones
  await initializeClients() // Reiniciar clientes
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

// Elimina la carpeta de una sesión específica
function deleteSession(clientId) {
  const sessionDir = path.join(SESSION_PATH, `session-${clientId}`)
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true })
      console.log(`🗑️ Sesión eliminada: ${clientId}`)
    }
  } catch (error) {
    console.error(`❌ Error eliminando sesión de ${clientId}:`, error)
  }
}

// Manejo de desconexión de un cliente
async function handleClientDisconnected(clientId) {
  console.log(`⚠️ Cliente desconectado: ${clientId}`)
  deleteSession(clientId)
  delete clients[clientId] // Elimina la referencia del cliente en memoria
  await initializeClients()
}


async function initializeClients() {
  try {
    const clientes = await selectWppParametros() // Llamamos a selectClientes()

    if (!clientes || clientes.length === 0) {
      console.log('⚠️ No hay clientes activos en la base de datos')
      return
    }

    // Detener y limpiar clientes anteriores
    stopClients()
    clients = {} // Resetear el objeto de clientes

    // Crear clientes dinámicamente
    clientes.forEach((cliente) => {
      const clientId = cliente.ID

      clients[clientId] = new Client({
        authStrategy: new LocalAuth({ clientId }),
        puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      })

      clients[clientId].on('qr', async (qr) => {
        console.log(`Escanea este QR con tu WhatsApp (${cliente.TELEFONO} - ${clientId}):`)
        const qrBuffer = await qrImage.toBuffer(qr)
        await updateEstado(0, `ESPERANDO QR`, clientId)
        await updateQrCode(qrBuffer, clientId)
        qrcode.generate(qr, {small: true})
      })

      clients[clientId].on('ready', async () => {
        console.log(`✅ Cliente listo: ${cliente.TELEFONO} (${clientId})`)
        await updateEstado(1, `LISTO`, clientId)
      })


      clients[clientId].on('disconnected', async (reason) => {
        console.log(`❌ Cliente desconectado (${clientId}): ${reason}`)
        await updateEstado(3, `DESCONECTADO, ${reason}`, clientId)
        handleClientDisconnected(clientId) // Manejar la desconexión
      })

      clients[clientId].initialize()
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

// Iniciar clientes
Object.values(clients).forEach(client => {
  client.on('qr', (qr) =>{
    console.log(`Escanea este QR con tu WhatsApp  ${client.authStrategy.clientId}!:`)
    qrcode.generate(qr, { small: true })
    console.log('\n\n\n\n\n')
  });
  client.on('ready', () => console.log(`Cliente listo: ${client.authStrategy.clientId}`));
  client.initialize();
});

app.use(`/${address}/message`, message)

app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}, address: ${address}`)
})

initialize().then(() => initializeClients())

// export client
export { clients }
