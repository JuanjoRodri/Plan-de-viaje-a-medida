import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_ROUTES = ["/my-shared-itineraries", "/my-itineraries", "/profile", "/admin"]
const ADMIN_ROUTES = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Usar la misma cookie 'session' que usan las páginas
  const sessionCookie = request.cookies.get("session")?.value

  console.log(`Middleware: Checking route ${pathname}`)
  console.log(`Middleware: Session cookie found: ${sessionCookie ? "YES" : "NO"}`)

  // Verificar si es una ruta protegida
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    if (!sessionCookie) {
      console.log(`Middleware: No session cookie for protected route ${pathname}. Redirecting to /login.`)
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect_to", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Si es una ruta de admin, verificar el rol del usuario desde la cookie
    if (isAdminRoute) {
      try {
        const session = JSON.parse(sessionCookie)
        if (session.role !== "admin") {
          console.log(`Middleware: User is not admin for route ${pathname}. Redirecting to /.`)
          return NextResponse.redirect(new URL("/", request.url))
        }
      } catch (error) {
        console.log(`Middleware: Invalid session cookie for admin route ${pathname}. Redirecting to /login.`)
        const loginUrl = new URL("/login", request.url)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // Si es la página de login y ya hay sesión, redirigir a la página principal
  if (pathname === "/login" && sessionCookie) {
    const redirectTo = request.nextUrl.searchParams.get("redirect_to") || "/"
    console.log(`Middleware: User already logged in. Redirecting from /login to ${redirectTo}.`)
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  console.log(`Middleware: Allowing access to ${pathname}`)
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)"],
}
