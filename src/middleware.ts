import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isLoginPage = nextUrl.pathname === "/login"

  // Si no está logueado y quiere entrar a la app -> al login
  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", nextUrl))
  }

  // Si está logueado y quiere ir al login -> al inicio
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
