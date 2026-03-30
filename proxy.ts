import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes
  const ownerRoutes = ['/owner']
  const ptRoutes = ['/pt']
  const clientRoutes = ['/client']

  const isOwnerRoute = ownerRoutes.some(r => pathname.startsWith(r))
  const isPtRoute = ptRoutes.some(r => pathname.startsWith(r))
  const isClientRoute = clientRoutes.some(r => pathname.startsWith(r))
  const isProtected = isOwnerRoute || isPtRoute || isClientRoute

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    if (isOwnerRoute) url.pathname = '/auth/owner-login'
    else if (isPtRoute) url.pathname = '/auth/pt-login'
    else url.pathname = '/auth/client-login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
