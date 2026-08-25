import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function classify(code: string | null, status: number) {
  if (code === 'credit_balance_exhausted') return 'Saldo de créditos da API esgotado.'
  if (code === 'organization_spend_limit_exceeded') return 'Limite de gastos da organização atingido.'
  if (code === 'project_spend_limit_exceeded') return 'Limite de gastos do projeto atingido.'
  if (code === 'organization_usage_limit_exceeded') return 'Limite de utilização da organização atingido.'
  if (status === 429) return 'A OpenAI devolveu HTTP 429. Verifique créditos, limites de utilização e rate limits.'
  return null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { p_user_id: user.id })
  if (adminError || !isAdmin) return NextResponse.json({ error: 'Acesso reservado ao proprietário.' }, { status: 403 })

  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini'
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json({
      ok: false,
      diagnostic: {
        status: 503,
        code: 'openai_api_key_missing',
        type: 'configuration_error',
        message: 'OPENAI_API_KEY não está configurada no ambiente.',
        model,
      },
    }, { status: 503 })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, instructions: 'Responda apenas com OK.', input: 'Diagnóstico PRETREINO.', max_output_tokens: 8 }),
      cache: 'no-store',
    })
    const raw = await response.json().catch(() => ({}))
    const openaiError = raw?.error || {}
    const code = openaiError?.code || null
    const type = openaiError?.type || null
    const message = openaiError?.message || null
    const requestId = response.headers.get('x-request-id') || null
    if (!response.ok) return NextResponse.json({ ok: false, diagnostic: { status: response.status, code, type, message, requestId, model, summary: classify(code, response.status) } })
    return NextResponse.json({ ok: true, diagnostic: { status: response.status, code: null, type: null, message: null, requestId, model, summary: 'OpenAI respondeu normalmente.' } })
  } catch (error) {
    return NextResponse.json({ ok: false, diagnostic: { status: 0, code: 'openai_network_error', type: 'network_error', message: error instanceof Error ? error.message : 'Falha de rede ao contactar a OpenAI.', model, summary: 'Não foi possível contactar a API da OpenAI.' } })
  }
}
