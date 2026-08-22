'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const plans = [
  { tag: 'FREE', title: 'PRETREINO Free', price: 'R$ 0', period: 'para começar', text: 'Experimente o ecossistema PRETREINO com treino, alimentação, evolução e IA com limites inteligentes.', action: 'Começar grátis', href: '/dashboard' },
  { tag: 'MAIS ESCOLHIDO', title: 'PRETREINO Pro', price: 'R$ 39,90', period: '/mês', annual: 'ou R$ 299,90/ano', text: 'Mais profundidade, personalização e inteligência para continuar a sua evolução.', action: 'Conhecer o Pro', highlight: true, href: '/assinatura' },
  { tag: 'EXPERIÊNCIA COMPLETA', title: 'PRETREINO Premium', price: 'R$ 59,90', period: '/mês', annual: 'ou R$ 449,90/ano', text: 'A experiência mais completa, com IA avançada, personalização e recursos premium.', action: 'Conhecer o Premium', href: '/assinatura' },
]

type Product = { id: string; name: string; description: string | null; category: string | null; price: number | null; currency: string; image_url: string | null; external_url: string | null; affiliate_url: string | null }

export default function LojaPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('store_products').select('id,name,description,category,price,currency,image_url,external_url,affiliate_url').eq('active', true).order('created_at', { ascending: false })
      setProducts((data || []) as Product[])
      setLoadingProducts(false)
    }
    load()
  }, [])

  const openProduct = async (product: Product) => {
    const supabase = createClient()
    await supabase.from('store_clicks').insert({ product_id: product.id })
    const url = product.affiliate_url || product.external_url
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const money = (product: Product) => product.price == null ? 'Consultar' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency || 'BRL' }).format(Number(product.price))

  return <main className="store-page">
    <header><Link href="/dashboard" className="brand"><span>P</span> PRETREINO</Link><div><span>LOJA</span><Link href="/dashboard">← Dashboard</Link></div></header>
    <section className="hero"><span>LOJA PRETREINO</span><h1>Invista na sua evolução<br/><em>no seu ritmo.</em></h1><p>Escolha a experiência PRETREINO que combina com o seu momento e explore produtos e suplementos selecionados pela plataforma.</p></section>

    <section className="plans"><div className="section-title"><span>EXPERIÊNCIA PRETREINO</span><h2>Comece onde fizer sentido para si.</h2></div><div className="plan-grid">{plans.map((plan) => <article key={plan.title} className={plan.highlight ? 'plan highlight' : 'plan'}>{plan.highlight && <div className="popular">MAIS ESCOLHIDO</div>}<small>{plan.tag}</small><h3>{plan.title}</h3><div className="price">{plan.price}<b>{plan.period}</b></div>{plan.annual && <div className="annual">{plan.annual}</div>}<p>{plan.text}</p><Link className="plan-link" href={plan.href}>{plan.action} →</Link></article>)}</div></section>

    <section className="products"><div className="section-title"><span>PRODUTOS & SUPLEMENTOS</span><h2>Escolhas para acompanhar a sua jornada.</h2><p>Os produtos desta área são cadastrados e geridos pelo painel administrativo do PRETREINO.</p></div>{loadingProducts ? <div className="empty">A carregar produtos...</div> : products.length === 0 ? <div className="empty"><strong>A loja está a preparar os primeiros produtos.</strong><span>Os produtos e suplementos adicionados pelo painel administrativo aparecerão aqui.</span></div> : <div className="product-grid">{products.map((product) => <article className="product" key={product.id}>{product.image_url ? <img src={product.image_url} alt="" /> : <div className="product-image">P</div>}<div className="product-body"><small>{product.category || 'DESTAQUE'}</small><h3>{product.name}</h3><p>{product.description || 'Produto selecionado para a sua jornada PRETREINO.'}</p><strong>{money(product)}</strong><button onClick={() => openProduct(product)}>Ver produto →</button></div></article>)}</div>}</section>

    <style jsx>{`*{box-sizing:border-box}.store-page{min-height:100vh;background:radial-gradient(circle at 80% 0%,rgba(37,99,235,.12),transparent 32%),#070810;color:#fff;font-family:Arial,sans-serif;padding-bottom:80px}.store-page header{height:78px;border-bottom:1px solid rgba(255,255,255,.07);padding:0 6vw;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:900;letter-spacing:.08em}.brand span{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5)}.store-page header div{display:flex;align-items:center;gap:18px;color:#777b8e;font-size:10px;letter-spacing:.14em;font-weight:900}.store-page header a:last-child{color:#a78bfa;letter-spacing:0}.hero,.plans,.products{max-width:1100px;margin:auto;padding-left:24px;padding-right:24px}.hero{padding-top:74px;padding-bottom:46px}.hero>span,.section-title>span{font-size:10px;color:#a78bfa;font-weight:900;letter-spacing:.18em}.hero h1{font-size:clamp(42px,6vw,68px);line-height:1;letter-spacing:-.05em;margin:14px 0}.hero em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.hero p{max-width:680px;color:#9296a8;line-height:1.7;font-size:15px}.section-title{margin-bottom:20px}.section-title h2{font-size:28px;margin:9px 0 6px;letter-spacing:-.03em}.section-title p{color:#777b8e;font-size:12px}.plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.plan{position:relative;min-height:355px;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:24px;background:#0c0e17;display:flex;flex-direction:column}.plan.highlight{background:radial-gradient(circle at 80% 10%,rgba(139,92,246,.23),transparent 40%),#111020;border-color:rgba(167,139,250,.3);transform:translateY(-4px)}.popular{position:absolute;top:14px;right:14px;font-size:8px;color:#e9d5ff;background:rgba(139,92,246,.18);border:1px solid rgba(192,132,252,.25);padding:6px 8px;border-radius:999px;font-weight:900}.plan small,.product small{font-size:9px;color:#777b8e;letter-spacing:.14em;font-weight:900}.plan h3{font-size:21px;margin:9px 0 22px}.price{font-size:35px;font-weight:900;letter-spacing:-.04em}.price b{font-size:11px;color:#777b8e;font-weight:700;margin-left:4px}.annual{color:#a78bfa;font-size:10px;margin-top:6px;font-weight:800}.plan p{font-size:12px;line-height:1.6;color:#85899a;margin:18px 0}.plan-link{margin-top:auto;display:block;text-align:center;border:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(124,47,240,.18),rgba(79,70,229,.12));color:#e9ddff;border-radius:10px;padding:12px;font-weight:900;text-decoration:none}.products{padding-top:78px}.product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.product{overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:20px;background:#0c0e17}.product-image,.product img{width:100%;height:190px;object-fit:cover}.product-image{display:grid;place-items:center;background:radial-gradient(circle at 50% 20%,rgba(168,85,247,.25),transparent 45%),#111322;color:#c084fc;font-size:50px;font-weight:900}.product-body{padding:20px;min-height:240px;display:flex;flex-direction:column}.product h3{font-size:19px;margin:8px 0}.product p{color:#85899a;font-size:12px;line-height:1.6;margin:0 0 12px}.product strong{font-size:20px;margin-bottom:15px}.product button{margin-top:auto;border:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(124,47,240,.18),rgba(79,70,229,.12));color:#e9ddff;border-radius:10px;padding:12px;font-weight:900}.empty{border:1px dashed rgba(255,255,255,.12);border-radius:18px;padding:40px;text-align:center;background:rgba(255,255,255,.02);display:flex;flex-direction:column;gap:8px;color:#85899a;font-size:12px}.empty strong{color:#fff;font-size:15px}.empty span{color:#6f7385}@media(max-width:800px){.plan-grid,.product-grid{grid-template-columns:1fr}.plan.highlight{transform:none}.hero{padding-top:50px}}`}</style>
  </main>
}
