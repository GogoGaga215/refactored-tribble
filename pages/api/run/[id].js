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
    const encrypted = script.encryptedData

    const decryptor = `
local HttpService = game:GetService("HttpService")
local function xor(a, b)
    local r = 0
    local p = 1
    while a > 0 or b > 0 do
        local ab = a % 2
        local bb = b % 2
        if ab ~= bb then r = r + p end
        p = p * 2
        a = math.floor(a / 2)
        b = math.floor(b / 2)
    end
    return r
end
local function decrypt(b64)
    local data = HttpService:Base64Decode(b64)
    local key = string.byte(data, 1)
    local enc = string.sub(data, 2)
    local out = ""
    for i = 1, #enc do
        out = out .. string.char(xor(string.byte(enc, i), key))
    end
    return out
end
local code = decrypt("${encrypted}")
loadstring(code)()
`

    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'no-store')
    res.send(decryptor)
  } catch (err) {
    res.status(500).send('print("Error: ' + err.message + '")')
  }
}
