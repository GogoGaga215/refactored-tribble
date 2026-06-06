import type { NextApiRequest, NextApiResponse } from 'next'
import { loadFileFromTmp } from '../upload'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  const fileData = loadFileFromTmp(id)

  if (!fileData) {
    return res.status(404).json({ error: 'File not found' })
  }

  const downloadName = `${fileData.customName || 'protected'}_locked.lua`

  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)
  res.setHeader('Cache-Control', 'no-store')

  const buffer = Buffer.from(fileData.encryptedData, 'base64')
  res.send(buffer)
}
