import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  const [file, setFile] = useState(null)
  const [customName, setCustomName] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [history, setHistory] = useState([])
  const [apiKey, setApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('zl_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {}
    }
    const savedKey = localStorage.getItem('zl_apikey')
    if (savedKey) setApiKey(savedKey)
  }, [])

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
  }

  const generateId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id = ''
    for (let i = 0; i < 16; i++) id += chars.charAt(Math.floor(Math.random() * chars.length))
    return id
  }

  const generateStrongKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    let key = ''
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setApiKey(key)
    showMessage('Strong key generated! Save it to use.', 'success')
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.lua')) {
      showMessage('Please select a .lua file only!', 'error')
      return
    }
    setFile(selected)
    setCustomName(selected.name.replace(/\.lua$/i, ''))
    setResult(null)
    showMessage('File selected! Tap "Protect & Generate Link" to continue.', 'success')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    if (!dropped.name.toLowerCase().endsWith('.lua')) {
      showMessage('Please drop a .lua file only!', 'error')
      return
    }
    setFile(dropped)
    setCustomName(dropped.name.replace(/\.lua$/i, ''))
    setResult(null)
    showMessage('File dropped! Tap "Protect & Generate Link" to continue.', 'success')
  }

  const protectAndGenerate = async () => {
    if (!file) {
      showMessage('No file selected! Tap the upload area first.', 'error')
      return
    }
    if (!apiKey) {
      setShowKeyModal(true)
      showMessage('Please set an API Key first!', 'error')
      return
    }

    setLoading(true)
    showMessage('Uploading... please wait', 'success')

    try {
      const plainCode = await file.text()
      const id = generateId()
      const name = customName.trim() || file.name.replace(/\.lua$/i, '')

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          customName: name,
          originalName: file.name,
          plainCode,
          size: file.size,
          apiKey,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      const record = {
        id,
        name,
        original: file.name,
        url: data.runUrl,
        token: data.token,
        size: file.size,
        date: new Date().toLocaleString(),
      }

      const newHistory = [record, ...history]
      setHistory(newHistory)
      localStorage.setItem('zl_history', JSON.stringify(newHistory))

      setResult({ url: data.runUrl, token: data.token, id })
      showMessage('Success! Your Lua script is now protected.', 'success')
    } catch (err) {
      showMessage('Error: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyLoadstring = () => {
    if (!result) return
    const code = `loadstring(game:HttpGet("${result.url}"))()`
    navigator.clipboard.writeText(code).then(() => {
      showMessage('Loadstring copied to clipboard!', 'success')
    }).catch(() => {
      showMessage('Failed to copy.', 'error')
    })
  }

  const copyRequestAsync = () => {
    if (!result) return
    const code = `local HttpService = game:GetService("HttpService")
local response = HttpService:RequestAsync({
    Url = "${result.url}",
    Method = "GET",
    Headers = { ["x-zinlocked-key"] = "${apiKey}" }
})
loadstring(response.Body)()`
    navigator.clipboard.writeText(code).then(() => {
      showMessage('RequestAsync code copied!', 'success')
    }).catch(() => {
      showMessage('Failed to copy.', 'error')
    })
  }

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      showMessage('Enter a valid API key!', 'error')
      return
    }
    localStorage.setItem('zl_apikey', apiKey)
    setShowKeyModal(false)
    showMessage('API Key saved!', 'success')
  }

  const resetAll = () => {
    setFile(null)
    setCustomName('')
    setResult(null)
    setMessage(null)
  }

  const loadHistory = (record) => {
    setResult({ url: record.url, token: record.token, id: record.id })
    setCustomName(record.name)
    showMessage('Loaded from history!', 'success')
  }

  const clickUpload = () => {
    const input = document.getElementById('fileInput')
    if (input) input.click()
  }

  return (
    <>
      <Head>
        <title>ZinLocked - Lua Script Protection</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        .zl-container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .zl-header { text-align: center; margin-bottom: 40px; padding-top: 20px; }
        .zl-logo { font-size: 2.5rem; font-weight: 900; background: linear-gradient(90deg, #00f5ff, #7b2ff7, #ff00aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 2px; }
        .zl-tagline { color: #00f5ff; font-size: 0.9rem; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; }
        .zl-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 30px; margin-bottom: 20px; }
        .zl-upload { border: 2px dashed rgba(0,245,255,0.3); border-radius: 16px; padding: 50px 30px; text-align: center; cursor: pointer; transition: 0.3s; background: rgba(0,245,255,0.02); }
        .zl-upload:hover { border-color: rgba(0,245,255,0.6); }
        .zl-upload.drag { border-color: #00f5ff; background: rgba(0,245,255,0.08); transform: scale(1.02); }
        .zl-upload-icon { font-size: 3rem; margin-bottom: 15px; }
        .zl-upload-text { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 8px; }
        .zl-upload-hint { font-size: 0.8rem; color: #666; }
        .zl-info { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px; margin-bottom: 15px; }
        .zl-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: #00f5ff; margin-bottom: 6px; font-weight: 700; }
        .zl-value { font-size: 0.9rem; color: #fff; word-break: break-all; }
        .zl-input { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 14px 16px; color: #fff; font-size: 1rem; outline: none; margin-bottom: 12px; }
        .zl-input:focus { border-color: #00f5ff; }
        .zl-btn { padding: 14px 28px; border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: 0.3s; text-transform: uppercase; letter-spacing: 1px; margin: 5px; }
        .zl-btn-primary { background: linear-gradient(135deg, #00f5ff, #7b2ff7); color: #fff; }
        .zl-btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .zl-btn-danger { background: linear-gradient(135deg, #ff0044, #ff8800); color: #fff; }
        .zl-btn-success { background: linear-gradient(135deg, #00ff64, #00aa44); color: #fff; }
        .zl-btn-group { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }
        .zl-result { background: rgba(0,0,0,0.5); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; padding: 20px; margin-top: 20px; text-align: center; position: relative; overflow: hidden; }
        .zl-result::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #00f5ff, #7b2ff7, transparent); animation: scan 3s linear infinite; }
        .zl-url { font-family: monospace; font-size: 0.85rem; color: #00f5ff; background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(0,245,255,0.15); word-break: break-all; margin: 10px 0; cursor: pointer; }
        .zl-loadstring { font-family: monospace; font-size: 0.75rem; color: #aaa; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); word-break: break-all; margin: 8px 0; }
        .zl-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(0,255,100,0.1); border: 1px solid rgba(0,255,100,0.3); color: #00ff64; padding: 8px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 15px; }
        .zl-dot { width: 8px; height: 8px; background: #00ff64; border-radius: 50%; animation: blink 2s infinite; }
        .zl-msg { padding: 12px 16px; border-radius: 10px; margin-bottom: 15px; font-size: 0.9rem; }
        .zl-msg-error { background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); color: #ff4444; }
        .zl-msg-success { background: rgba(0,255,100,0.1); border: 1px solid rgba(0,255,100,0.3); color: #00ff64; }
        .zl-footer { text-align: center; margin-top: 40px; color: #555; font-size: 0.8rem; }
        .zl-footer-text { color: #00f5ff; font-weight: 700; font-size: 1rem; margin-bottom: 5px; }
        .zl-file-item { display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; }
        .zl-fname { font-weight: 600; color: #fff; font-size: 0.9rem; }
        .zl-furl { font-family: monospace; font-size: 0.7rem; color: #666; margin-top: 2px; }
        .zl-factions { display: flex; gap: 6px; }
        .zl-small { padding: 6px 12px; font-size: 0.75rem; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: rgba(20,20,30,0.95); border: 1px solid rgba(0,245,255,0.2); border-radius: 16px; padding: 30px; max-width: 400px; width: 90%; }
        .modal-title { font-size: 1.2rem; font-weight: 700; color: #00f5ff; margin-bottom: 15px; }
        .modal-text { color: #aaa; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5; }
        .key-display { font-family: monospace; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; color: #00f5ff; font-size: 0.85rem; word-break: break-all; margin: 10px 0; }
        .key-row { display: flex; gap: 8px; align-items: center; }
        .key-row .zl-input { margin-bottom: 0; flex: 1; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>

      <div className="zl-container">
        <div className="zl-header">
          <div className="zl-logo">ZINLOCKED</div>
          <div className="zl-tagline">Real logos, 1000x cooler.</div>
        </div>

        <div className="zl-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div className="zl-label" style={{ margin: 0 }}>API Key</div>
            <button className="zl-btn zl-btn-secondary zl-small" onClick={() => setShowKeyModal(true)}>
              {apiKey ? 'Change Key' : 'Set Key'}
            </button>
          </div>
          {apiKey ? (
            <div className="key-display">{apiKey.substring(0, 8)}****</div>
          ) : (
            <div style={{ color: '#ff4444', fontSize: '0.85rem' }}>No API Key set. Scripts will be public.</div>
          )}
        </div>

        <div className="zl-card">
          {message && (
            <div className={`zl-msg ${message.type === 'error' ? 'zl-msg-error' : 'zl-msg-success'}`}>
              {message.text}
            </div>
          )}

          {!file && (
            <div
              className="zl-upload"
              onClick={clickUpload}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag') }}
              onDragLeave={(e) => e.currentTarget.classList.remove('drag')}
              onDrop={handleDrop}
            >
              <div className="zl-upload-icon">&#128193;</div>
              <div className="zl-upload-text">Tap here to upload Lua file</div>
              <div className="zl-upload-hint">.lua files only</div>
            </div>
          )}

          <input
            id="fileInput"
            type="file"
            accept=".lua"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {file && (
            <div>
              <div className="zl-badge"><span className="zl-dot"></span>File Ready</div>
              <div className="zl-info">
                <div className="zl-label">Selected File</div>
                <div className="zl-value">{file.name}</div>
              </div>
              <div className="zl-info">
                <div className="zl-label">File Size</div>
                <div className="zl-value">{formatSize(file.size)}</div>
              </div>
              <div className="zl-label">Custom Name (optional)</div>
              <input
                className="zl-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter name or leave blank"
              />
              <div className="zl-btn-group">
                <button className="zl-btn zl-btn-primary" onClick={protectAndGenerate} disabled={loading}>
                  {loading ? 'Processing...' : '🔒 Protect & Generate Link'}
                </button>
                <button className="zl-btn zl-btn-secondary" onClick={resetAll}>&#10005; Clear</button>
              </div>
            </div>
          )}

          {result && (
            <div className="zl-result">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#00f5ff', fontWeight: 700, marginBottom: '10px' }}>
                &#128272; Protected Run URL
              </div>
              <div className="zl-loadstring">{`loadstring(game:HttpGet("${result.url}"))()`}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '10px' }}>Method 1: HttpGet (Token-based)</div>
              <div className="zl-btn-group">
                <button className="zl-btn zl-btn-primary" onClick={copyLoadstring}>
                  &#128203; Copy Loadstring
                </button>
              </div>
              <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '10px' }}>Method 2: RequestAsync (API Key header)</div>
                <div className="zl-btn-group">
                  <button className="zl-btn zl-btn-secondary" onClick={copyRequestAsync}>
                    &#128203; Copy RequestAsync
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="zl-card">
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '15px' }}>&#128737; Protected Scripts</div>
            {history.map((h) => (
              <div className="zl-file-item" key={h.id}>
                <div>
                  <div className="zl-fname">{h.name}</div>
                  <div className="zl-furl">{h.url}</div>
                </div>
                <div className="zl-factions">
                  <button className="zl-btn zl-btn-secondary zl-small" onClick={() => loadHistory(h)}>Load</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="zl-footer">
          <div className="zl-footer-text">ZinLocked</div>
          <div>Real logos, 1000x cooler. - Deployed on Vercel</div>
        </div>
      </div>

      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">&#128272; API Key Authentication</div>
            <div className="modal-text">
              Set a secret API key to protect your scripts. Only executors with this key can access your scripts via RequestAsync. The token-based URL also works for basic protection.
            </div>
            <div className="zl-label">Your API Key</div>
            <div className="key-row">
              <input
                className="zl-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter a strong secret key..."
                type="password"
              />
              <button className="zl-btn zl-btn-success" onClick={generateStrongKey}>
                &#9889; Generate
              </button>
            </div>
            <div className="zl-btn-group" style={{ marginTop: '20px' }}>
              <button className="zl-btn zl-btn-primary" onClick={saveApiKey}>
                Save Key
              </button>
              <button className="zl-btn zl-btn-secondary" onClick={() => setShowKeyModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
