import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json().catch(() => ({}))
  const id = body?.data?.id || body?.id || new URL(req.url).searchParams.get('id')
  const type = body?.type || body?.topic || 'unknown'
  if (!id) return NextResponse.json({ received: true })
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 })

  if (type === 'payment' || type.includes('payment')) {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return NextResponse.json({ received: true })
    const payment = await r.json()
    const orderId = String(payment.external_reference || '')
    if (orderId) {
      const statusMap: Record<string,string> = { approved:'paid', pending:'pending', in_process:'pending', rejected:'canceled', cancelled:'canceled', refunded:'refunded', charged_back:'refunded' }
      const status = statusMap[payment.status] || 'pending'
      if (status === 'paid') {
        const {data:order}=await supabase.from('store_orders').select('stock_decremented_at').eq('id',orderId).maybeSingle()
        if (!order?.stock_decremented_at) {
          const {data:stockOk}=await supabase.rpc('decrement_store_order_stock',{p_order_id:orderId})
          if (stockOk === false) return NextResponse.json({received:true,inventory:'insufficient'})
        }
      }
      await supabase.from('store_orders').update({ status, external_payment_id:String(payment.id), updated_at:new Date().toISOString() }).eq('id',orderId)
      const {data:order}=await supabase.from('store_orders').select('user_id').eq('id',orderId).maybeSingle()
      await supabase.from('payment_events').insert({user_id:order?.user_id||null,provider:'mercadopago',external_event_id:String(id),event_type:type,status,payload:payment})
    }
    return NextResponse.json({ received:true })
  }

  let external: any = null
  if (type.includes('subscription') || type.includes('preapproval')) {
    const r = await fetch(`https://api.mercadopago.com/preapproval/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    if (r.ok) external = await r.json()
  }
  if (!external) return NextResponse.json({ received: true })
  const reference = String(external.external_reference || '')
  const [userId, planId] = reference.split(':')
  if (!userId || !planId) return NextResponse.json({ received: true })
  const statusMap: Record<string,string> = { authorized:'active', paused:'paused', cancelled:'canceled', canceled:'canceled', pending:'pending' }
  const status = statusMap[external.status] || external.status || 'pending'
  const periodEnd = external.next_payment_date || external.end_date || null
  await supabase.from('premium_subscriptions').upsert({ user_id:userId, plan_id:planId, status, external_subscription_id:String(external.id), current_period_end:periodEnd, updated_at:new Date().toISOString() }, { onConflict:'user_id' })
  await supabase.from('payment_events').insert({ user_id:userId, plan_id:planId, provider:'mercadopago', external_event_id:String(id), event_type:type, status, payload:external })
  return NextResponse.json({ received:true })
}
