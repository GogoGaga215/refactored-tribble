import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

const fileStore = new Map<string, any>()

type UploadResponse = {
  success: boolean
  id?: string
  virtualUrl?: string
  error?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { id, customName, originalName, encryptedData, size } = req.body

    if (!id || !encryptedData) {
      return res.status(400).json({ success: false, error: 'Missing data' })
    }

    const fileData = {
      id,
      customName: customName || originalName?.replace(/\.lua$/i, '') || 'protected',
      originalName: originalName || 'file.lua',
      encryptedData,
      size: size || 0,
      createdAt: new Date().toISOString(),
    }

    fileStore.set(id, fileData)

    try {
      fs.writeFileSync(`/tmp/${id}.json`, JSON.stringify(fileData))
    } catch (e) {}

    const host = req.headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const virtualUrl = `${protocol}://${host}/virtual/file/${id}`

    return res.status(200).json({
      success: true,
      id,
      virtualUrl,
    })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

export function loadFileFromTmp(id: string): any | null {
  if (fileStore.has(id)) {
    return fileStore.get(id)
  }
  try {
    const data = fs.readFileSync(`/tmp/${id}.json`, 'utf-8')
    const parsed = JSON.parse(data)
    fileStore.set(id, parsed)
    return parsed
  } catch {
    return null
  }
}
