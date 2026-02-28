import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: { headers: request.headers },
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
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    const isLoginPage = pathname === '/login'
    const isAdminRoute = pathname.startsWith('/admin')
    const isDashboardRoute = pathname.startsWith('/dashboard')
    const isOnboardingRoute = pathname.startsWith('/onboarding')
    const isResetPasswordRoute = pathname.startsWith('/reset-password')
    const isPublicRoute = pathname === '/' || pathname.startsWith('/book') || pathname.startsWith('/salon') || isResetPasswordRoute

    // 1. Not logged in → protected route → redirect login
    if (!user && (isAdminRoute || isDashboardRoute || isOnboardingRoute)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return copyAndRedirect(supabaseResponse, url)
    }

    // 2. Logged in → get role from app_metadata (set by service_role when creating user)
    if (user) {
        const role = user.app_metadata?.role as string | undefined

        // 2a. Login page → redirect to appropriate dashboard
        if (isLoginPage) {
            const url = request.nextUrl.clone()
            url.pathname = role === 'super_admin' ? '/admin' : '/dashboard'
            return copyAndRedirect(supabaseResponse, url)
        }

        // 2b. /admin → only super_admin
        if (isAdminRoute && role !== 'super_admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return copyAndRedirect(supabaseResponse, url)
        }

        // 2c. /dashboard or /onboarding → manager or coiffeur only
        if ((isDashboardRoute || isOnboardingRoute) && role !== 'manager' && role !== 'coiffeur' && role !== 'super_admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return copyAndRedirect(supabaseResponse, url)
        }
    }

    return supabaseResponse
}

function copyAndRedirect(supabaseResponse: NextResponse, url: URL): NextResponse {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
            path: cookie.path,
            domain: cookie.domain,
            maxAge: cookie.maxAge,
            expires: cookie.expires,
            sameSite: cookie.sameSite,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
        })
    })
    return redirectResponse
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/dashboard/:path*',
        '/onboarding/:path*',
        '/login',
    ],
}
