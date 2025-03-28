import { readFileSync } from 'fs'
import mime from 'mime-types'
import { clients } from '../routes/routes.js'
import pkg from 'whatsapp-web.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getClientById } from '../utils.js'
const { MessageMedia } = pkg

export const sendFile = async (req, res) => {
  // const { phone, caption, name_pdf } = req.query
  const { phone, caption, name_pdf, id } = req.body

  // Obtener el cliente de WhatsApp, cuando client.authStrategy.clientId === id
  const client = getClientById(id)

  // validar que el cliente esta logueado
  if (!client) {
    return res.status(400).json({ error: 'Cliente no logueado' })
  }

  if (!phone || !name_pdf) {
    return res.status(400).json({ error: 'Faltan parámetros: phone y name pdf' })
  }

  try {
    // WhatsApp requiere el formato internacional con el código de país sin "+"
    const formattedNumber = phone.includes('@c.us') ? phone : `593${phone}@c.us`

    // Obtener la ruta del archivo
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    // Ruta del archivo
    const filePath = process.env.NODE_ENV === 'production' ? join('/docpdf', name_pdf) : join(__dirname, '../test2.pdf')
    // const filePath = '/docpdf/' + name_pdf;

    // Imprimir la ruta completa del archivo
    console.log('Ruta completa del archivo:', filePath)

    // const directoryPath = '/pdfdocs';
    //
    // fs.readdir(directoryPath, (err, files) => {
    //   if (err) {
    //     console.error('Error al leer el directorio:', err);
    //     return;
    //   }
    //   console.log('Archivos en /pdfdocs:', files);
    // });

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
    res.status(500).json({ error: 'Error enviando el archivo', message: error.message })
  }
}

export const sendMessage = async (req, res) => {
  const { phone, message, id } = req.query

  // Obtener el cliente de WhatsApp
  const client = clients[id]
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
