import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json().catch(() => ({}))

  const asaasEvent = typeof body?.event === 'string' ? body.event : ''
  if (asaasEvent.startsWith('CHECKOUT_') || asaasEvent.startsWith('SUBSCRIPTION_') || asaasEvent.startsWith('PAYMENT_')) {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN
    if (webhookToken && req.headers.get('asaas-access-token') !== webhookToken) {
      return NextResponse.json({ error: 'Webhook não autorizado.' }, { status: 401 })
    }
    if (!process.env.ASAAS_API_KEY) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 })

    const eventId = String(body?.id || '')
    if (!eventId) return NextResponse.json({ received: true })

    const { data: existing } = await supabase
      .from('payment_events')
      .select('id')
      .eq('provider', 'asaas')
      .eq('external_event_id', eventId)
      .maybeSingle()
    if (existing) return NextResponse.json({ received: true, duplicate: true })

    const checkout = body?.checkout || null
    const subscription = body?.subscription || null
    const payment = body?.payment || null
    const externalReference = String(checkout?.externalReference || subscription?.externalReference || payment?.externalReference || '')
    let userId: string | null = null
    let planId: string | null = null
    if (externalReference.includes(':')) [userId, planId] = externalReference.split(':')

    if ((!userId || !planId) && checkout?.id) {
      const { data: created } = await supabase
        .from('payment_events')
        .select('user_id,plan_id,payload')
        .eq('provider', 'asaas')
        .eq('external_event_id', String(checkout.id))
        .maybeSingle()
      if (created) {
        userId = created.user_id
        planId = created.plan_id
      }
    }

    await supabase.from('payment_events').insert({
      user_id: userId,
      plan_id: planId,
      provider: 'asaas',
      external_event_id: eventId,
      event_type: asaasEvent,
      status: checkout?.status || subscription?.status || payment?.status || null,
      payload: body
    })

    if (asaasEvent === 'CHECKOUT_PAID' && userId && planId) {
      const subscriptionId = subscription?.id || checkout?.subscription?.id || null
      if (subscriptionId) {
        await supabase.from('premium_subscriptions').upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          external_subscription_id: String(subscriptionId),
          current_period_end: subscription?.nextDueDate || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }
    }

    if (asaasEvent === 'SUBSCRIPTION_CREATED' || asaasEvent === 'SUBSCRIPTION_UPDATED') {
      const subscriptionId = subscription?.id
      if (subscriptionId && userId && planId) {
        const statusMap: Record<string, string> = { ACTIVE: 'active', INACTIVE: 'canceled' }
        const status = statusMap[String(subscription?.status || '').toUpperCase()] || 'active'
        await supabase.from('premium_subscriptions').upsert({
          user_id: userId,
          plan_id: planId,
          status,
          external_subscription_id: String(subscriptionId),
          current_period_end: subscription?.nextDueDate || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }
    }

    if (asaasEvent === 'SUBSCRIPTION_INACTIVATED' || asaasEvent === 'SUBSCRIPTION_DELETED') {
      const subscriptionId = subscription?.id
      if (subscriptionId) {
        await supabase.from('premium_subscriptions').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('external_subscription_id', String(subscriptionId))
      }
    }

    return NextResponse.json({ received: true })
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  const id = body?.data?.id || body?.id || new URL(req.url).searchParams.get('id')
  const type = body?.type || body?.topic || 'unknown'
  if (!id) return NextResponse.json({ received: true })
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
