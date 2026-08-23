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

  await supabase.from('premium_subscriptions').upsert({
    user_id: userId,
    plan_id: planId,
    status,
    external_subscription_id: String(external.id),
    current_period_end: periodEnd,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })

  await supabase.from('payment_events').insert({
    user_id: userId,
    plan_id: planId,
    provider: 'mercadopago',
    external_event_id: String(id),
    event_type: type,
    status,
    payload: external
  })

  return NextResponse.json({ received: true })
}
