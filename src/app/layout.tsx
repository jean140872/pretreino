import './globals.css'
import './premium-pages.css'
import type { ReactNode } from 'react'
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
