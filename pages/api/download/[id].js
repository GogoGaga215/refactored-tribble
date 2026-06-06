import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  try {
    const data = await redis.get(`script:${id}`)
    if (!data) {
      return res.status(404).json({ error: 'File not found' })
    }

    const script = typeof data === 'string' ? JSON.parse(data) : data
    const downloadName = `${script.name || 'protected'}_locked.lua`

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)
    res.setHeader('Cache-Control', 'no-store')
    res.send(Buffer.from(script.encryptedData, 'base64'))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
