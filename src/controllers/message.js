import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import mime from 'mime-types'
import { client } from '../routes/routes.js'
import { MessageMedia } from 'whatsapp-web.js'

export const sendFile = async (req, res) => {
  const { phone, caption } = req.query

  if (!phone) {
    return res.status(400).json({ error: 'Faltan parámetros: phone y caption' })
  }

  try {
    // WhatsApp requiere el formato internacional con el código de país sin "+"
    const formattedNumber = phone.includes('@c.us') ? phone : `593${phone}@c.us`

    // Obtener la ruta del archivo
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    // Ruta del archivo
    const filePath = join(__dirname, '/test2.pdf')

    // Leer el archivo
    const fileBuffer = readFileSync(filePath)

    // Detectar el tipo de archivo
    const fileType = mime.lookup(filePath) || 'application/octet-stream'

    // Convertir a base64
    const fileBase64 = fileBuffer.toString('base64')

    // Crear el objeto de media para WhatsApp
    const media = new MessageMedia(fileType, fileBase64, 'test2.pdf')

    console.log('✅ Archivo cargado correctamente:', filePath)

    // Enviar el archivo con el mensaje opcional
    await client.sendMessage(formattedNumber, media, { caption })

    console.log(`📂 Archivo enviado a ${formattedNumber}`)
    res.json({ success: true, message: 'Archivo enviado correctamente' })
  } catch (error) {
    console.error('❌ Error enviando el archivo:', error)
    res.status(500).json({ error: 'Error enviando el archivo' })
  }
}

export const sendMessage = async (req, res) => {
  const { phone, message } = req.query

  // Validar que los parámetros existan
  if (!phone || !message) {
    return res.status(400).json({ error: 'Faltan parámetros: phone y message' })
  }

  try {
    // WhatsApp requiere el formato internacional con el código de país sin "+"
    const formattedNumber = phone.includes('@c.us') ? phone : `593${phone}@c.us`

    // Enviar el mensaje
    await client.sendMessage(formattedNumber, message)
    console.log(`📨 Mensaje enviado a ${phone}: ${message}`)

    res.json({ success: true, message: 'Mensaje enviado correctamente' })
  } catch (error) {
    console.error('❌ Error enviando el mensaje:', error)
    res.status(500).json({ error: 'Error enviando el mensaje' })
  }
}
