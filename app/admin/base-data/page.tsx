'use client'
// Version 3 - Redirect page with no external imports
// This page redirects to /admin/basedata

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BaseDataRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/basedata')
  }, [router])
  
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">正在跳转到基础数据管理...</p>
      </div>
    </div>
  )
}
