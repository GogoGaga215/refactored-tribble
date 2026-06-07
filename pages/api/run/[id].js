import { Redis } from 'ioredis'
import crypto from 'crypto'

const redis = new Redis(process.env.REDIS_URL || process.env.KV_URL || '')
const SERVER_SECRET = process.env.ZINLOCKED_SECRET || 'aB3#fG7$hJ9&kL2@mN4$pQ6'

function verifyToken(id, token, apiKey) {
  const key = apiKey || 'public'
  const expected = crypto.createHmac('sha256', SERVER_SECRET).update(id + key).digest('hex').substring(0, 16)
  return token === expected
}

export default async function handler(req, res) {
  const { id, token } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).send('print("Invalid ID")')
  }

  // Block all browsers — no exceptions
  const ua = req.headers['user-agent'] || ''
  const isBrowser = ua.includes('Mozilla') || ua.includes('Chrome') || ua.includes('Safari') || ua.includes('Edge') || ua.includes('Firefox') || ua.includes('Opera')

  if (isBrowser) {
    return res.status(403).send('print("Access denied — Browser access blocked")')
  }

  try {
    const data = await redis.get(`script:${id}`)
    if (!data) {
      return res.status(404).send('print("Script not found or expired")')
    }

    const script = JSON.parse(data)

    // Method 1: API Key in header (RequestAsync) — most secure
    const authHeader = req.headers['x-zinlocked-key'] || ''
    if (authHeader && script.apiKey && authHeader === script.apiKey) {
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Cache-Control', 'no-store')
      res.send(script.plainCode)
      return
    }

    // Method 2: HMAC token in URL (HttpGet) — basic protection
    if (!token || !verifyToken(id, token, script.apiKey)) {
      return res.status(403).send('print("Access denied — Invalid or missing token")')
    }

    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'no-store')
    res.send(script.plainCode)
  } catch (err) {
    res.status(500).send('print("Error: ' + err.message + '")')
  }
}
