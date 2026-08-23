import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Você precisa estar autenticado.' }, { status: 401 })

  const { planId } = await req.json()
  if (!planId) return NextResponse.json({ error: 'Plano não informado.' }, { status: 400 })

  const { data: plan, error } = await supabase
    .from('premium_plans')
    .select('id,name,price,currency,interval,provider,checkout_url,external_plan_id,active')
    .eq('id', planId)
    .eq('active', true)
    .single()

  if (error || !plan) return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 })

  if (plan.checkout_url) {
    await supabase.from('admin_events').insert({
      admin_user_id: user.id,
      event_type: 'checkout_started',
      entity_type: 'premium_plan',
      entity_id: plan.id,
      metadata: { provider: plan.provider, source: 'subscription_page' }
    })
    return NextResponse.json({ url: plan.checkout_url })
  }

  if (plan.provider === 'mercadopago' && process.env.MERCADOPAGO_ACCESS_TOKEN && plan.external_plan_id) {
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://pretreino.onrender.com'
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
        back_url: `${origin}/assinatura/sucesso`
      })
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: 'O provedor recusou a criação do checkout.' }, { status: 502 })
    await supabase.from('payment_events').insert({ user_id: user.id, plan_id: plan.id, provider: 'mercadopago', external_event_id: data.id || null, event_type: 'checkout_created', status: data.status || null, payload: { reference: `${user.id}:${plan.id}` } })
    return NextResponse.json({ url: data.init_point || data.sandbox_init_point || null })
  }

  return NextResponse.json({ error: 'O checkout deste plano ainda não está configurado no provedor de pagamento.' }, { status: 503 })
}
