import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Faça login para usar a PRETREINO IA.' }, { status: 401 })

  const { conversationId, message } = await req.json().catch(() => ({}))
  if (!conversationId || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Conversa e mensagem são obrigatórias.' }, { status: 400 })
  }

  const ownerEmail = (process.env.PRETREINO_OWNER_EMAIL || '').trim().toLowerCase()
  const isOwner = !!ownerEmail && user.email?.trim().toLowerCase() === ownerEmail

  const { data: conversation, error: conversationError } = await supabase
    .from('ai_conversations')
    .select('id,title,context')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()
  if (conversationError || !conversation) return NextResponse.json({ error: 'Conversa não encontrada.' }, { status: 404 })

  const { data: subscription } = await supabase
    .from('premium_subscriptions')
    .select('status,premium_plans(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const planName = (subscription?.premium_plans as { name?: string } | null)?.name || 'Free'
  if (!isOwner && !subscription) {
    return NextResponse.json({ error: 'A PRETREINO IA completa é um recurso Premium.', upgradeUrl: '/assinatura', premiumRequired: true }, { status: 402 })
  }

  const { data: previous } = await supabase
    .from('ai_messages')
    .select('role,content,created_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(30)

  const [{ data: profile }, { data: fitness }, { data: preferences }, { data: training }] = await Promise.all([
    supabase.from('profiles').select('display_name,city').eq('id', user.id).maybeSingle(),
    supabase.from('fitness_profiles').select('goal,experience_level,sex,height_cm,notes').eq('user_id', user.id).maybeSingle(),
    supabase.from('fitness_preferences').select('weekly_frequency,training_location,available_equipment,preferred_activities,general_preferences').eq('user_id', user.id).maybeSingle(),
    supabase.from('training_plans').select('name,goal,days_per_week,active').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const history = (previous || []).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
  history.push({ role: 'user', content: message.trim() })

  const system = `Você é a PRETREINO IA, assistente de fitness, treino e nutrição da plataforma PRETREINO. Seja prático, claro e personalizado. Use o contexto disponível, mas não invente dados. Quando falar de nutrição ou saúde, deixe claro quando for uma estimativa e recomende um profissional quando a situação exigir avaliação clínica. Nunca afirme ter acesso a dados que não estão no contexto. Responda em português do Brasil.\n\nPlano: ${isOwner ? 'Owner — acesso total para testes' : planName}\nPerfil: ${JSON.stringify(profile || {})}\nPerfil fitness: ${JSON.stringify(fitness || {})}\nPreferências: ${JSON.stringify(preferences || {})}\nPlano de treino activo: ${JSON.stringify(training || {})}\nContexto da conversa: ${JSON.stringify(conversation.context || {})}`

  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ error: 'A chave de IA ainda não está configurada no ambiente.' }, { status: 503 })

  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, instructions: system, input: history, max_output_tokens: 900 }),
  })

  const raw = await response.json().catch(() => ({}))
  if (!response.ok) {
    const openaiError = raw?.error || {}
    console.error('PRETREINO IA OpenAI error', {
      status: response.status,
      code: openaiError?.code || null,
      type: openaiError?.type || null,
      message: openaiError?.message || null,
      requestId: response.headers.get('x-request-id') || null,
      model,
      owner: isOwner,
    })
    if (isOwner) {
      return NextResponse.json({
        error: 'A chamada à OpenAI falhou.',
        diagnostic: {
          status: response.status,
          code: openaiError?.code || null,
          type: openaiError?.type || null,
          message: openaiError?.message || null,
          requestId: response.headers.get('x-request-id') || null,
          model,
        },
      }, { status: 502 })
    }
    return NextResponse.json({ error: 'Não foi possível obter uma resposta da IA neste momento.' }, { status: 502 })
  }

  const answer = raw.output?.flatMap((item: any) => item.content || []).find((item: any) => item.type === 'output_text')?.text?.trim()
  if (!answer) return NextResponse.json({ error: 'A IA não devolveu uma resposta válida.' }, { status: 502 })

  const { error: userMessageError } = await supabase.from('ai_messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content: message.trim(), metadata: { plan: isOwner ? 'Owner' : planName } })
  if (userMessageError) return NextResponse.json({ error: 'A IA respondeu, mas não foi possível guardar a mensagem.' }, { status: 500 })
  const { error: assistantMessageError } = await supabase.from('ai_messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content: answer, metadata: { model } })
  if (assistantMessageError) return NextResponse.json({ error: 'A resposta foi gerada, mas não pôde ser guardada.' }, { status: 500 })

  await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId).eq('user_id', user.id)

  return NextResponse.json({ answer, ownerAccess: isOwner, plan: isOwner ? 'Owner' : planName })
}
