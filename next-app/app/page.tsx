'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/hopetech-landing.html')
  }, [router])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Redirecting to landing page...</p>
    </div>
  )
}
