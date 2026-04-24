'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Barcode } from 'lucide-react'

interface ScanInputProps {
  onScan: (barcode: string) => void
}

export function ScanInput({ onScan }: ScanInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus inteligente para estar siempre listo para el escáner
  useEffect(() => {
    // Focus inicial
    inputRef.current?.focus()

    // Si el usuario empieza a escribir en cualquier lado de la pantalla,
    // movemos el foco al input automáticamente (excepto si está en otro input)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !e.ctrlKey && !e.altKey && !e.metaKey
      ) {
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const barcode = value.trim()
    if (barcode) {
      onScan(barcode)
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Barcode className="h-5 w-5 text-primary/70 group-focus-within:text-primary transition-colors" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        placeholder="Escanear código o buscar..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 pr-12 h-12 w-full bg-zinc-900/50 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:ring-2 shadow-inner transition-all group-hover:bg-zinc-900/80 text-lg font-mono placeholder:font-sans"
        autoComplete="off"
      />
      <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
        <button 
          type="submit" 
          className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
