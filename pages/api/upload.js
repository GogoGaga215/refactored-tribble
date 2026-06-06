import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { id, customName, originalName, encryptedData, size } = req.body

    if (!id || !encryptedData) {
      return res.status(400).json({ success: false, error: 'Missing data' })
    }

    const host = req.headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const virtualUrl = `${protocol}://${host}/api/run/${id}`

    await kv.set(`script:${id}`, JSON.stringify({
      id,
      name: customName || originalName?.replace(/\.lua$/i, '') || 'protected',
      originalName: originalName || 'file.lua',
      encryptedData,
      size: size || 0,
      createdAt: new Date().toISOString(),
    }), { ex: 2592000 }) // 30 days expiry

    return res.status(200).json({
      success: true,
      id,
      virtualUrl,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
