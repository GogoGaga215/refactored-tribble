import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || process.env.KV_URL || '')

export default async function handler(req, res) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).send('print("Invalid ID")')
  }

  try {
    const data = await redis.get(`script:${id}`)
    if (!data) {
      return res.status(404).send('print("Script not found or expired")')
    }

    const script = JSON.parse(data)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'no-store')
    res.send(script.encryptedData)
  } catch (err) {
    res.status(500).send('print("Error: ' + err.message + '")')
  }
}
