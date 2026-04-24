import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    // Aquí podrías agregar más proveedores si quisieras, 
    // pero por ahora heredamos los de config.
  ]
})
