import express from 'express'
import { sendFile, sendMessage } from '../controllers/message.js'

export const message = express.Router()

// Ruta para enviar mensajes
message.get('/send-message', async (req, res) => {
  await sendMessage(req, res)
})

// Ruta para enviar un archivo
message.get('/send-file', async (req, res) => {
  await sendFile(req, res)
})
