import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/gestao') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/gestao-safe'
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/gestao'],
}
