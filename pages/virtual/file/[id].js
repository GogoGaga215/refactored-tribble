import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function ProtectedPage() {
  const router = useRouter()
  const { id } = router.query
  const [fileData, setFileData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const allFiles = JSON.parse(localStorage.getItem('zl_files') || '{}')
    const data = allFiles[id]
    if (data) {
      setFileData(data)
    } else {
      setNotFound(true)
    }
  }, [id])

  if (notFound) {
    return (
      <div style={styles.body}>
        <div style={styles.box}>
          <div style={{...styles.lock, fontSize: '3rem'}}>&#128683;</div>
          <div style={styles.title}>FILE NOT FOUND</div>
          <div style={styles.msg}>This virtual file link does not exist or has expired.</div>
        </div>
      </div>
    )
  }

  if (!fileData) {
    return <div style={{...styles.body, color: '#00f5ff'}}>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>Protected - ZinLocked</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={styles.body}>
        <div style={styles.box}>
          <div style={styles.lock}>&#128737;</div>
          <div style={styles.title}>ACCESS DENIED</div>
          <div style={styles.msg}>
            <strong style={styles.strong}>This script is protected and cannot be viewed or copied from a browser.</strong>
            The Lua source code has been encrypted and secured using ZinLocked&apos;s virtual file protection system.
            Only authorized clients with the proper decryption key can execute this script.
          </div>
          <div style={styles.url}>{fileData.url || `https://zin.locked.com/virtual/file/${id}`}</div>
          <a href={`/api/download/${id}`} style={styles.btnPrimary}>
            &#11015; Download Protected File
          </a>
          <div style={styles.footer}>ZinLocked &bull; Real logos, 1000x cooler.</div>
        </div>
      </div>
    </>
  )
}

const styles = {
  body: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#0a0a0f',
    color: '#e0e0e0',
    margin: 0,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  box: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  },
  lock: {
    fontSize: '4rem',
    marginBottom: '20px',
    animation: 'pulse 2s infinite',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 900,
    background: 'linear-gradient(90deg, #ff0044, #ff8800)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '20px',
  },
  msg: {
    fontSize: '1rem',
    color: '#aaa',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  strong: {
    color: '#fff',
    display: 'block',
    marginBottom: '10px',
    fontSize: '1.1rem',
  },
  url: {
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#00f5ff',
    background: 'rgba(0,0,0,0.4)',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(0,245,255,0.2)',
    wordBreak: 'break-all',
    marginBottom: '20px',
  },
  btnPrimary: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    background: 'linear-gradient(135deg, #00f5ff, #7b2ff7)',
    color: '#fff',
  },
  footer: {
    marginTop: '30px',
    color: '#555',
    fontSize: '0.75rem',
  },
}
