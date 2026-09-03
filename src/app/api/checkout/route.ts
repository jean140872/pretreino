import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Você precisa estar autenticado.' }, { status: 401 })

  const { planId } = await req.json().catch(() => ({}))
  if (!planId) return NextResponse.json({ error: 'Plano não informado.' }, { status: 400 })

  const { data: plan, error } = await supabase
    .from('premium_plans')
    .select('id,name,description,price,currency,interval,provider,checkout_url,external_plan_id,active')
    .eq('id', planId)
    .eq('active', true)
    .single()

  if (error || !plan) return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 })

  if (plan.checkout_url) {
    await supabase.from('payment_events').insert({
      user_id: user.id,
      plan_id: plan.id,
      provider: plan.provider,
      event_type: 'checkout_created',
      status: 'created',
      payload: { checkout_url: plan.checkout_url, source: 'subscription_page' }
    })
    return NextResponse.json({ url: plan.checkout_url })
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://pretreino.onrender.com'

  if (plan.provider === 'asaas') {
    const token = process.env.ASAAS_API_KEY
    if (!token) return NextResponse.json({ error: 'O pagamento da assinatura ainda não está configurado no provedor.' }, { status: 503 })
    if (plan.price == null || Number(plan.price) <= 0) return NextResponse.json({ error: 'O plano não possui um preço válido.' }, { status: 400 })

    const apiUrl = (process.env.ASAAS_API_URL || 'https://api.asaas.com/v3').replace(/\/$/, '')
    const cycle = plan.interval === 'year' ? 'YEARLY' : 'MONTHLY'
    const externalReference = `${user.id}:${plan.id}`
    const response = await fetch(`${apiUrl}/checkouts`, {
      method: 'POST',
      headers: { access_token: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billingTypes: ['PIX', 'CREDIT_CARD'],
        chargeTypes: ['RECURRENT'],
        minutesToExpire: 60,
        externalReference,
        callback: {
          successUrl: `${origin}/assinatura?status=success`,
          cancelUrl: `${origin}/assinatura?status=canceled`,
          expiredUrl: `${origin}/assinatura?status=expired`
        },
        items: [{
          name: plan.name,
          description: plan.description || `Assinatura ${plan.name}`,
          quantity: 1,
          value: Number(plan.price)
        }],
        subscription: {
          cycle,
          nextDueDate: new Date().toISOString().slice(0, 10)
        }
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.id) {
      console.error('Asaas subscription checkout failed', { status: response.status, data, planId: plan.id })
      return NextResponse.json({ error: 'O provedor recusou a criação do checkout.' }, { status: 502 })
    }

    const checkoutId = String(data.id)
    await supabase.from('payment_events').insert({
      user_id: user.id,
      plan_id: plan.id,
      provider: 'asaas',
      external_event_id: checkoutId,
      event_type: 'checkout_created',
      status: 'active',
      payload: { checkout_id: checkoutId, external_reference: externalReference }
    })

    return NextResponse.json({ url: `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}` })
  }

  if (plan.provider === 'mercadopago' && process.env.MERCADOPAGO_ACCESS_TOKEN && plan.external_plan_id) {
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        preapproval_plan_id: plan.external_plan_id,
        reason: plan.name,
        payer_email: user.email,
        external_reference: `${user.id}:${plan.id}`,
        back_url: `${origin}/assinatura?status=success`
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return NextResponse.json({ error: 'O provedor recusou a criação do checkout.' }, { status: 502 })
    await supabase.from('payment_events').insert({ user_id: user.id, plan_id: plan.id, provider: 'mercadopago', external_event_id: data.id || null, event_type: 'checkout_created', status: data.status || null, payload: { reference: `${user.id}:${plan.id}` } })
    return NextResponse.json({ url: data.init_point || data.sandbox_init_point || null })
  }

  return NextResponse.json({ error: 'O checkout deste plano ainda não está configurado no provedor de pagamento.' }, { status: 503 })
}
