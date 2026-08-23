import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {createAdminClient} from '@/lib/supabase/admin'

type InputItem={id:string;quantity:number}
export async function POST(req:Request){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:'Você precisa estar autenticado.'},{status:401})
 const body=await req.json().catch(()=>({})); const items=(body.items||[]) as InputItem[]; const shipping=body.shipping||{}
 if(!items.length)return NextResponse.json({error:'Carrinho vazio.'},{status:400})
 const ids=[...new Set(items.map(i=>i.id))]
 const {data:products,error}=await supabase.from('store_products').select('id,name,price,currency,active').in('id',ids).eq('active',true)
 if(error||!products?.length)return NextResponse.json({error:'Um ou mais produtos já não estão disponíveis.'},{status:409})
 const byId=new Map(products.map(p=>[p.id,p])); const normalized=items.map(i=>{const p=byId.get(i.id);const q=Math.max(1,Math.min(99,Number(i.quantity)||1));return p?{p,q}:null}).filter(Boolean) as {p:any;q:number}[]
 if(normalized.length!==items.length)return NextResponse.json({error:'Alguns produtos não estão disponíveis.'},{status:409})
 if(normalized.some(x=>x.p.price==null||Number(x.p.price)<=0))return NextResponse.json({error:'Todos os produtos do checkout precisam ter preço definido.'},{status:400})
 const subtotal=normalized.reduce((s,x)=>s+Number(x.p.price)*x.q,0); const admin=createAdminClient()
 const {data:order,error:oe}=await admin.from('store_orders').insert({user_id:user.id,status:'pending',currency:'BRL',subtotal,total:subtotal,shipping_name:shipping.name||null,shipping_email:shipping.email||user.email||null,shipping_phone:shipping.phone||null,shipping_address:{zip:shipping.zip||null,address:shipping.address||null,city:shipping.city||null,state:shipping.state||null}}).select('id').single()
 if(oe||!order)return NextResponse.json({error:'Não foi possível criar o pedido.'},{status:500})
 await admin.from('store_order_items').insert(normalized.map(x=>({order_id:order.id,product_id:x.p.id,product_name:x.p.name,unit_price:Number(x.p.price),quantity:x.q,currency:x.p.currency||'BRL'})))
 const token=process.env.MERCADOPAGO_ACCESS_TOKEN
 if(!token)return NextResponse.json({error:'O pagamento da Loja ainda não está configurado no provedor.'},{status:503})
 const origin=req.headers.get('origin')||process.env.NEXT_PUBLIC_APP_URL||'https://pretreino.onrender.com'
 const response=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({items:normalized.map(x=>({id:x.p.id,title:x.p.name,quantity:x.q,currency_id:x.p.currency||'BRL',unit_price:Number(x.p.price)})),payer:{email:user.email},external_reference:order.id,back_urls:{success:`${origin}/pedidos`,failure:`${origin}/checkout-loja?status=failure`,pending:`${origin}/pedidos`},auto_return:'approved',notification_url:`${origin}/api/webhooks/mercadopago`})})
 const data=await response.json().catch(()=>({}))
 if(!response.ok){await admin.from('store_orders').update({status:'canceled'}).eq('id',order.id);return NextResponse.json({error:'O provedor recusou a criação do pagamento.'},{status:502})}
 await admin.from('store_orders').update({external_preference_id:String(data.id)}).eq('id',order.id)
 return NextResponse.json({url:data.init_point||data.sandbox_init_point||null,orderId:order.id})
}
