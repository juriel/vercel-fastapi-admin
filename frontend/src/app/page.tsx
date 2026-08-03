'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    import('../components/hello-form')
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main>
      <hello-form></hello-form>
    </main>
  )
}
