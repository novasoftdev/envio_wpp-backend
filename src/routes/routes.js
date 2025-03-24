import express from 'express'
import pkg from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'

import cors from 'cors'

import { message } from './message.js'
const { LocalAuth, Client } = pkg

const app = express()
const port = process.env.PORT || 3000
const address = process.env.NODE_ENV === 'production' ? 'wpp' : 'wpd'
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.json({}))

// Inicializa el cliente de WhatsApp con LocalAuth (para guardar la sesión)
const client = new Client({
  authStrategy: new LocalAuth()
})

// Muestra el QR en la terminal cuando sea necesario
client.on('qr', qr => {
  console.log('Escanea este QR con tu WhatsApp:')
  qrcode.generate(qr, { small: true })
})

// Mensaje cuando el cliente está listo
client.on('ready', () => {
  console.log('✅ Cliente de WhatsApp listo!')
})

// Inicializa el cliente de WhatsApp
client.initialize().then()

app.use(`/${address}/message`, message)

// Inicia el servidor Express
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}, address: ${address}`)
})

// export client
export { client }
