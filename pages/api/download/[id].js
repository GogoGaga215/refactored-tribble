export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Download - ZinLocked</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 40px; max-width: 500px; }
    .title { color: #00f5ff; font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; }
    .msg { color: #aaa; margin-bottom: 20px; }
    .btn { background: linear-gradient(135deg, #00f5ff, #7b2ff7); color: #fff; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div class="box">
    <div class="title">Preparing Download...</div>
    <div class="msg" id="status">Retrieving your protected file...</div>
    <button class="btn" id="dlBtn" style="display:none">Download File</button>
  </div>
  <script>
    const id = '${id}';
    const allFiles = JSON.parse(localStorage.getItem('zl_files') || '{}');
    const fileData = allFiles[id];
    const status = document.getElementById('status');
    const btn = document.getElementById('dlBtn');
    
    if (!fileData) {
      status.textContent = 'File not found. Please upload the file again from the device you used to protect it.';
      status.style.color = '#ff4444';
    } else {
      status.textContent = 'File ready: ' + fileData.name + '_protected.lua';
      btn.style.display = 'inline-block';
      btn.onclick = function() {
        const blob = new Blob([fileData.encrypted], {type: 'application/octet-stream'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name + '_protected.lua';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };
    }
  </script>
</body>
</html>`)
}
