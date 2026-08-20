import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <meta httpEquiv="refresh" content="0;url=/hopetech-landing.html" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.location.href = '/hopetech-landing.html';
            }
          `
        }} />
      </Head>
      <div style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        color: '#666'
      }}>
        <p>Redirecting to landing page...</p>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          <a href="/hopetech-landing.html" style={{ color: '#0066cc' }}>
            Click here if you are not redirected automatically
          </a>
        </p>
      </div>
    </>
  )
}
