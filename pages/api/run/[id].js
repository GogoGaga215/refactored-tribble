import { Redis } from 'ioredis'
import crypto from 'crypto'

const redis = new Redis(process.env.REDIS_URL || process.env.KV_URL || '')
const SERVER_SECRET = process.env.ZINLOCKED_SECRET || 'aB3#fG7$hJ9&kL2@mN4$pQ6'

function verifyToken(id, token, apiKey) {
  if (!token) return false
  const key = apiKey || 'public'
  const expected = crypto.createHmac('sha256', SERVER_SECRET).update(id + key).digest('hex').substring(0, 16)
  return token === expected
}

export default async function handler(req, res) {
  const { id, token } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).send('print("Invalid ID")')
  }

  // PERMISSIVE: Only block obvious browsers, allow ALL executors
  const ua = req.headers['user-agent'] || ''
  const accept = req.headers['accept'] || ''
  
  // Block if it looks like a real browser (has both Mozilla AND Accept text/html)
  const isRealBrowser = (ua.includes('Mozilla') && (accept.includes('text/html') || accept.includes('*/*'))) 
    && !ua.includes('Roblox') 
    && !ua.includes('Electron')
    && !req.headers['x-executor']
    && !req.headers['x-zinlocked-key']

  if (isRealBrowser) {
    return res.status(403).send('print("Access denied")')
  }

  try {
    const data = await redis.get(`script:${id}`)
    
    if (!data) {
      return res.status(404).send('print("Script not found")')
    }

    const script = JSON.parse(data)

    // Method 1: API Key header (RequestAsync)
    const authHeader = req.headers['x-zinlocked-key'] || req.headers['x-api-key'] || ''
    if (script.apiKey && authHeader === script.apiKey) {
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Cache-Control', 'no-store')
      res.send(script.plainCode)
      return
    }

    // Method 2: HMAC token (HttpGet)
    if (!token || !verifyToken(id, token, script.apiKey)) {
      return res.status(403).send('print("Access denied")')
    }

    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'no-store')
    res.send(script.plainCode)
  } catch (err) {
    res.status(500).send('print("Error")')
  }
}
