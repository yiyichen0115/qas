'use client'

import { useEffect } from 'react'
import { Sidebar } from './sidebar'
import { AISidebar } from './ai-sidebar'
import { useAppStore } from '@/stores/app-store'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const initialize = useAppStore((state) => state.initialize)
  const aiSidebarOpen = useAppStore((state) => state.aiSidebarOpen)
  const setAiSidebarOpen = useAppStore((state) => state.setAiSidebarOpen)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <AISidebar open={aiSidebarOpen} onOpenChange={setAiSidebarOpen} />
    </div>
  )
}
