import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — keeps auth token alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect dashboard and admin routes
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  const isGuest = user?.user_metadata?.role === 'Guest'

  // Guests cannot access the worker dashboard
  if (pathname.startsWith('/dashboard') && isGuest) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/guest'
    redirectUrl.searchParams.set('restricted', '1')
    return NextResponse.redirect(redirectUrl)
  }

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  const ADMIN_EMAIL = 'admin@google.com'

  if (isAuthPage && user) {
    const redirectUrl = request.nextUrl.clone()
    if (user.email === ADMIN_EMAIL) {
      redirectUrl.pathname = '/admin'
    } else if (isGuest) {
      redirectUrl.pathname = '/guest'
    } else {
      redirectUrl.pathname = '/dashboard'
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Prevent Prakarya users from accessing /admin routes
  if (pathname.startsWith('/admin') && user && user.email !== ADMIN_EMAIL) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    redirectUrl.searchParams.set('restricted', '1')
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
