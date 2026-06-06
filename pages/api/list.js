import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const keys = await kv.keys('script:*')
    const scripts = []

    for (const key of keys) {
      const data = await kv.get(key)
      if (data) {
        const script = JSON.parse(data)
        scripts.push({
          id: script.id,
          name: script.name,
          originalName: script.originalName,
          size: script.size,
          createdAt: script.createdAt,
        })
      }
    }

    res.status(200).json({ success: true, scripts })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
