import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/clients', '/onboarding']

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  if (!PROTECTED.some(p => path.startsWith(p))) return NextResponse.next()

  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Basic ')) {
    const decoded  = Buffer.from(auth.slice(6), 'base64').toString()
    const [, pass] = decoded.split(':')                   // user:pass — we only check the password
    if (pass === process.env.DASHBOARD_PASSWORD) return NextResponse.next()
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Aspis by CyberShield"' },
  })
}

export const config = {
  matcher: ['/dashboard/:path*', '/clients/:path*', '/onboarding/:path*', '/onboarding'],
}
