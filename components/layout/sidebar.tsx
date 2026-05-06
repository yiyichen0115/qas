'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Settings2,
  Users,
  Shield,
  ChevronDown,
  PlayCircle,
  FolderOpen,
  Wallet,
  Briefcase,
  Package,
} from 'lucide-react'
import { documentTypeStorage } from '@/lib/storage'
import type { DocumentType } from '@/lib/types'

interface NavItem {
  title: string
  href?: string
  icon: React.ReactNode
  children?: { title: string; href: string; icon?: React.ReactNode }[]
  isDynamic?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Wallet,
  Briefcase,
  Package,
  Settings2,
  FolderOpen,
  PlayCircle,
}

const getStaticNavItems = (): NavItem[] => [
  {
    title: '仪表盘',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: '单据中心',
    icon: <PlayCircle className="h-5 w-5" />,
    isDynamic: true,
    children: [
      { title: '全部单据', href: '/runtime/documents' },
    ],
  },
  {
    title: '设计中心',
    icon: <Settings2 className="h-5 w-5" />,
    children: [
      { title: '单据类型管理', href: '/designer/document-types' },
      { title: '单据表单设计', href: '/designer/form' },
      { title: '列表设计', href: '/designer/list' },
      { title: '流程设计', href: '/designer/workflow' },
      { title: '页面配置', href: '/designer/page-config' },
    ],
  },
  {
    title: '系统管理',
    icon: <Shield className="h-5 w-5" />,
    children: [
      { title: '用户管理', href: '/admin/users' },
      { title: '角色管理', href: '/admin/roles' },
      { title: '权限配置', href: '/admin/permissions' },
      { title: '基础数据', href: '/admin/basedata' },
      { title: '基础库管理', href: '/admin/master-data' },
      { title: '资料管理', href: '/admin/knowledge' },
      { title: 'AI规则配置', href: '/admin/ai-rules' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['设计中心', '系统管理', '单据中心'])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [navItems, setNavItems] = useState<NavItem[]>(getStaticNavItems())

  // 加载单据类型并更新导航
  useEffect(() => {
    const loadDocumentTypes = () => {
      const types = documentTypeStorage.getPublished()
      setDocumentTypes(types)
      
      // 更新导航项
      const staticItems = getStaticNavItems()
      const updatedItems = staticItems.map(item => {
        if (item.isDynamic && item.title === '单据中心') {
          const dynamicChildren = types.map(dt => ({
            title: dt.name,
            href: `/runtime/documents/type/${dt.id}`,
            icon: dt.icon,
          }))
          return {
            ...item,
            children: [
              { title: '全部单据', href: '/runtime/documents' },
              ...dynamicChildren,
            ],
          }
        }
        return item
      })
      setNavItems(updatedItems)
    }

    loadDocumentTypes()
    
    // 监听 storage 变化以实时更新
    const handleStorageChange = () => {
      loadDocumentTypes()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // 也监听自定义事件，用于同页面内的更新
    window.addEventListener('documentTypesUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('documentTypesUpdated', handleStorageChange)
    }
  }, [])

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (pathname === href) return true
    // 特殊处理: /runtime/documents 不应匹配 /runtime/documents/type/xxx
    if (href === '/runtime/documents') {
      return pathname === '/runtime/documents'
    }
    return pathname.startsWith(href + '/')
  }
  
  const isChildActive = (children?: { href: string }[]) =>
    children?.some((child) => {
      if (pathname === child.href) return true
      // 特殊处理: /runtime/documents 不应匹配 /runtime/documents/type/xxx
      if (child.href === '/runtime/documents') {
        return pathname === '/runtime/documents'
      }
      return pathname.startsWith(child.href + '/')
    })

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">AC问答平台</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isChildActive(item.children)
                        ? 'bg-sidebar-accent/50 text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedItems.includes(item.title) && 'rotate-180'
                      )}
                    />
                  </button>
                  {expandedItems.includes(item.title) && item.children && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive(child.href)
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
            <Users className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">管理员</p>
            <p className="truncate text-xs text-sidebar-foreground/60">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
