import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = { type:'object', additionalProperties:false, properties:{ meal_name:{type:'string'}, confidence:{type:'number'}, calories:{type:'number'}, protein_g:{type:'number'}, carbs_g:{type:'number'}, fat_g:{type:'number'}, serving_description:{type:'string'}, notes:{type:'string'}, items:{type:'array',items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},estimated_grams:{type:'number'},calories:{type:'number'},protein_g:{type:'number'},carbs_g:{type:'number'},fat_g:{type:'number'}},required:['name','estimated_grams','calories','protein_g','carbs_g','fat_g']}}},required:['meal_name','confidence','calories','protein_g','carbs_g','fat_g','serving_description','notes','items'] }

export async function POST(req:Request){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:'Faça login para usar o scanner.'},{status:401})
 const form=await req.formData(); const file=form.get('image'); if(!(file instanceof File))return NextResponse.json({error:'Envie uma fotografia do alimento.'},{status:400})
 if(file.size>8*1024*1024)return NextResponse.json({error:'A imagem deve ter no máximo 8 MB.'},{status:413})
 if(!file.type.startsWith('image/'))return NextResponse.json({error:'O ficheiro enviado não é uma imagem.'},{status:400})
 const {count}=await supabase.from('food_scans').select('id',{count:'exact',head:true}).gte('created_at',new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString())
 const {data:sub}=await supabase.from('premium_subscriptions').select('status,premium_plans(name)').eq('user_id',user.id).eq('status','active').maybeSingle()
 const paid=!!sub
 if(!paid && (count||0)>=3)return NextResponse.json({error:'Você atingiu as 3 análises gratuitas deste mês. Continue no Pro ou Premium para análises avançadas.',upgradeUrl:'/assinatura',limitReached:true},{status:402})
 const key=process.env.OPENAI_API_KEY; if(!key)return NextResponse.json({error:'O scanner de alimentos está pronto, mas a chave de IA ainda não foi configurada no ambiente.'},{status:503})
 const bytes=Buffer.from(await file.arrayBuffer()); const dataUrl=`data:${file.type};base64,${bytes.toString('base64')}`
 const prompt='Analise esta fotografia de uma refeição. Identifique os alimentos visíveis, estime porções em gramas e calcule calorias e macronutrientes aproximados. Não invente precisão: use confiança baixa quando a porção ou alimento estiver incerto. Considere preparações visíveis. Responda apenas no JSON solicitado. Isto é uma estimativa educativa, não medição laboratorial.'
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_FOOD_VISION_MODEL||'gpt-4.1-mini',input:[{role:'user',content:[{type:'input_text',text:prompt},{type:'input_image',image_url:dataUrl,detail:'high'}]}],text:{format:{type:'json_schema',name:'food_analysis',strict:true,schema}}})})
 const raw=await r.json().catch(()=>({})); if(!r.ok)return NextResponse.json({error:'A análise da imagem falhou. Tente outra fotografia com boa iluminação.'},{status:502})
 const text=raw.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==='output_text')?.text; if(!text)return NextResponse.json({error:'A IA não devolveu uma análise válida.'},{status:502})
 let result:any; try{result=JSON.parse(text)}catch{return NextResponse.json({error:'A resposta da IA não pôde ser interpretada.'},{status:502})}
 const admin=createAdminClient(); const {data:saved,error:saveError}=await admin.from('food_scans').insert({user_id:user.id,meal_name:result.meal_name,confidence:result.confidence,calories:result.calories,protein_g:result.protein_g,carbs_g:result.carbs_g,fat_g:result.fat_g,serving_description:result.serving_description,items:result.items,notes:result.notes}).select('id,meal_name,confidence,calories,protein_g,carbs_g,fat_g,serving_description,items,notes,created_at').single()
 if(saveError)return NextResponse.json({error:'A análise foi concluída, mas não pôde ser guardada no histórico.'},{status:500})
 return NextResponse.json({scan:saved,remainingFree:paid?null:Math.max(0,2-(count||0))})
}
