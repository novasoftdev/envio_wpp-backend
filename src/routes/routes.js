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

// Crear clientes para múltiples números
const clients = {
  num1: new Client({
    authStrategy: new LocalAuth({ clientId: "numero_1" }),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  }),
  num2: new Client({
    authStrategy: new LocalAuth({ clientId: "numero_2" }),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  }),
  // num3: new Client({
  //   authStrategy: new LocalAuth({ clientId: "numero_3" }),
  //   puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  // })
};



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

// Inicia el servidor Express
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}, address: ${address}`)
})

// export client
export { clients }
