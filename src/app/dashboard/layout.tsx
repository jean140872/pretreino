'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProgressOverlay from './progress-overlay'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true)
  return <>
    {visible && <div className="store-highlight"><div className="store-highlight-inner"><div className="store-highlight-icon">◇</div><div className="store-highlight-copy"><span>NOVO NO PRETREINO</span><strong>Produtos & Suplementos</strong><p>Explore a loja premium e descubra produtos selecionados para acompanhar a sua evolução.</p></div><Link href="/produtos-suplementos" className="store-highlight-cta">Explorar loja <b>→</b></Link><button aria-label="Fechar destaque" onClick={() => setVisible(false)}>×</button></div></div>}
    {children}
    <ProgressOverlay />
    <style jsx global>{`.store-highlight{position:fixed;left:258px;right:0;top:78px;z-index:7;padding:10px 24px;background:linear-gradient(90deg,rgba(80,35,155,.94),rgba(34,52,125,.94));border-bottom:1px solid rgba(216,180,254,.25);box-shadow:0 12px 35px rgba(0,0,0,.28);backdrop-filter:blur(14px)}.store-highlight-inner{max-width:1100px;margin:auto;min-height:64px;display:flex;align-items:center;gap:14px}.store-highlight-icon{width:42px;height:42px;flex:none;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);font-size:22px;color:#f3e8ff}.store-highlight-copy{min-width:0}.store-highlight-copy span{display:block;font-size:8px;letter-spacing:.16em;color:#d8b4fe;font-weight:900}.store-highlight-copy strong{display:block;font-size:15px;margin-top:2px}.store-highlight-copy p{margin:2px 0 0;color:#d1d5e2;font-size:10px}.store-highlight-cta{margin-left:auto;flex:none;padding:11px 15px;border-radius:10px;background:#fff;color:#28134d;font-size:10px;font-weight:900}.store-highlight-cta b{margin-left:6px}.store-highlight-inner>button{width:30px;height:30px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.15);color:#fff;border-radius:50%;font-size:18px;cursor:pointer}@media(max-width:700px){.store-highlight{left:0;top:0;padding:9px 12px}.store-highlight-inner{gap:9px}.store-highlight-icon{width:34px;height:34px}.store-highlight-copy p{display:none}.store-highlight-cta{padding:9px 10px}.store-highlight-inner>button{width:26px;height:26px}}`}</style>
  </>
}
