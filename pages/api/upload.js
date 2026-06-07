import { Redis } from 'ioredis'
import crypto from 'crypto'

const redis = new Redis(process.env.REDIS_URL || process.env.KV_URL || '')
const SERVER_SECRET = process.env.ZINLOCKED_SECRET || 'aB3#fG7$hJ9&kL2@mN4$pQ6'

function generateToken(id, apiKey) {
  const key = apiKey || 'public'
  return crypto.createHmac('sha256', SERVER_SECRET).update(id + key).digest('hex').substring(0, 16)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { id, customName, originalName, plainCode, size, apiKey } = req.body

    if (!id || !plainCode) {
      return res.status(400).json({ success: false, error: 'Missing data' })
    }

    const host = req.headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const token = generateToken(id, apiKey)
    const runUrl = `${protocol}://${host}/api/run/${id}?token=${token}`

    await redis.setex(`script:${id}`, 2592000, JSON.stringify({
      id,
      name: customName || originalName?.replace(/\.lua$/i, '') || 'protected',
      originalName: originalName || 'file.lua',
      plainCode,
      apiKey: apiKey || null,
      token,
      size: size || 0,
      createdAt: new Date().toISOString(),
    }))

    return res.status(200).json({
      success: true,
      id,
      runUrl,
      token,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
