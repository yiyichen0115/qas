import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { InitPacDocument } from '@/components/init-pac-document'
import { InitLacDocument } from '@/components/init-lac-document'
import { InitReturnGoodsDocument } from '@/components/init-return-goods-document'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AC问答平台',
  description: '支持表单设计、流程配置、页面配置和权限管理的企业级问答平台',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <InitPacDocument />
        <InitLacDocument />
        <InitReturnGoodsDocument />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
