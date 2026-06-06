import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).send('print("Invalid ID")')
  }

  const ua = req.headers['user-agent'] || ''
  const isRoblox = ua.includes('Roblox') || ua.includes('Synapse') || ua.includes('Krnl') || ua.includes('Fluxus') || ua.includes('Electron') || req.headers['x-executor']

  if (!isRoblox) {
    return res.status(403).send('print("Access denied - use loadstring(game:HttpGet(...))()")')
  }

  try {
    const data = await redis.get(`script:${id}`)
    if (!data) {
      return res.status(404).send('print("Script not found or expired")')
    }

    const script = typeof data === 'string' ? JSON.parse(data) : data
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'no-store')
    res.send(script.encryptedData)
  } catch (err) {
    res.status(500).send('print("Error: ' + err.message + '")')
  }
}
