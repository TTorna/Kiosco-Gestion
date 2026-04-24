import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        const userStr = credentials?.username as string
        const passStr = credentials?.password as string

        // --- ACCESO DE EMERGENCIA HARDCODEADO ---
        if (userStr === 'admin' && passStr === 'gladmin') {
          return { id: 'admin-fixed', name: 'Admin Glmodas', role: 'ADMIN' }
        }
        if (userStr === 'user' && passStr === 'user123') {
          return { id: 'user-fixed', name: 'Usuario Caja', role: 'USER' }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt"
  },
  trustHost: true,
} satisfies NextAuthConfig
