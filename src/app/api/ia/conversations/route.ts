import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Faça login para usar a PRETREINO IA.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 70) : ''
  if (!title) return NextResponse.json({ error: 'Escreva uma mensagem para iniciar a conversa.' }, { status: 400 })

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: user.id,
      title,
      context: { source: 'dashboard', created_by: 'user' },
    })
    .select('id,title,updated_at')
    .single()

  if (error || !data) {
    console.error('AI conversation creation failed', error)
    return NextResponse.json({ error: 'Não foi possível iniciar a conversa.', detail: error?.message || 'Erro desconhecido.' }, { status: 500 })
  }

  return NextResponse.json({ conversation: data })
}
