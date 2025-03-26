import { join } from 'path'
import { readFileSync } from 'fs'
import mime from 'mime-types'
import { client } from '../routes/routes.js'
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;


export const sendFile = async (req, res) => {
  const { phone, caption, name_pdf } = req.query

  if (!phone) {
    return res.status(400).json({ error: 'Faltan parámetros: phone y caption' })
  }

  try {
    // WhatsApp requiere el formato internacional con el código de país sin "+"
    const formattedNumber = phone.includes('@c.us') ? phone : `593${phone}@c.us`

    // Obtener la ruta del archivo
    // const __filename = fileURLToPath(import.meta.url)
    // const __dirname = dirname(__filename)

    // Ruta del archivo
    const filePath = join('/docpdf', name_pdf)
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
