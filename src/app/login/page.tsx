'use client'

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PackageOpen, ArrowRight, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Credenciales inválidas')
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="flex h-screen items-center justify-center relative overflow-hidden bg-[#0A0A0B]">
      
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-4 relative z-10">
        
        {/* Glassmorphism Card */}
        <div className="glass rounded-2xl p-10 backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-primary/5">
          
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 transform hover:scale-105 transition-transform">
              <PackageOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Kiosko<span className="text-primary">App</span></h1>
            <p className="text-sm text-zinc-400 text-center">Accede a tu sistema de gestión de inventario y punto de venta.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300 font-medium">Usuario</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-primary h-12 text-md transition-all hover:bg-zinc-900/80"
                placeholder="Ingresa tu usuario"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-zinc-300 font-medium">Contraseña</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-primary h-12 text-md transition-all hover:bg-zinc-900/80"
                placeholder="••••••••"
              />
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-destructive animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 text-md font-semibold bg-white text-black hover:bg-zinc-200 transition-all group mt-2 rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-xs text-center text-zinc-500 bg-zinc-900/50 rounded-lg py-3 px-4 border border-zinc-800">
            <span className="block mb-1 text-zinc-400 font-medium">Cuentas de prueba:</span>
            <div className="flex justify-center gap-4">
              <code>admin / admin123</code>
              <code>user / user123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
