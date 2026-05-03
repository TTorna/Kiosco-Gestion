'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag, PlusCircle, Loader2, Trash2, Edit2, Info } from 'lucide-react'

const queryClient = new QueryClient()

export default function PromotionsClientWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <PromotionsClient />
    </QueryClientProvider>
  )
}

function PromotionsClient() {
  const [showForm, setShowForm] = useState(false)
  const queryClientHook = useQueryClient()

  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState('BUY_X_PAY_Y')
  const [productId, setProductId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [buyQuantity, setBuyQuantity] = useState(3)
  const [payQuantity, setPayQuantity] = useState(2)
  const [fixedPrice, setFixedPrice] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const { data: promotions = [], isLoading: loadingPromos } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const res = await fetch('/api/promotions')
      if (!res.ok) throw new Error('Error fetching promotions')
      return res.json()
    }
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Error fetching products')
      return res.json()
    }
  })

  const createPromo = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error creating promo')
      return res.json()
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['promotions'] })
      setShowForm(false)
      resetForm()
    },
    onError: (err: any) => alert(err.message)
  })

  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting promo')
    },
    onSuccess: () => queryClientHook.invalidateQueries({ queryKey: ['promotions'] }),
    onError: (err: any) => alert(err.message)
  })

  const resetForm = () => {
    setName('')
    setType('BUY_X_PAY_Y')
    setProductId('')
    setBuyQuantity(3)
    setPayQuantity(2)
    setFixedPrice(0)
    setIsActive(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !productId) return alert('Completa nombre y producto')
    
    if (type === 'BUY_X_PAY_Y') {
      if (buyQuantity <= 1 || payQuantity >= buyQuantity || payQuantity <= 0) {
        return alert('Cantidades inválidas para Llevá X Pagá Y')
      }
    } else if (type === 'QUANTITY_FIXED_PRICE') {
      if (buyQuantity <= 1 || fixedPrice <= 0) {
        return alert('Cantidades inválidas para Precio Fijo')
      }
    }

    createPromo.mutate({
      name, type, productId, buyQuantity, payQuantity, fixedPrice, isActive
    })
  }

  if (loadingPromos || loadingProducts) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!showForm ? (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" /> Promociones Activas
            </h2>
            <Button onClick={() => setShowForm(true)} className="rounded-xl shadow-lg shadow-primary/20">
              <PlusCircle className="mr-2 h-4 w-4" /> Nueva Promo
            </Button>
          </div>

          {promotions.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              No hay promociones configuradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-400">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((p: any) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{p.name}</td>
                      <td className="px-6 py-4">{p.product?.name}</td>
                      <td className="px-6 py-4">
                        {p.type === 'BUY_X_PAY_Y' ? (
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold">Llevá {p.buyQuantity} Pagá {p.payQuantity}</span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">{p.buyQuantity} por ${p.fixedPrice}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.isActive ? (
                          <span className="text-emerald-400 text-xs font-bold">ACTIVO</span>
                        ) : (
                          <span className="text-zinc-500 text-xs font-bold">INACTIVO</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/20 rounded-xl" onClick={() => {
                          if (confirm('Eliminar promoción?')) deletePromo.mutate(p.id)
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/5 shadow-2xl animate-in slide-in-from-bottom-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold">Nueva Promoción</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Nombre de la Promo (interno y ticket)</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej: 3x2 en Alfajores" className="h-12 bg-zinc-900/50 rounded-xl" />
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-zinc-400">Producto asociado</label>
              
              {productId ? (
                <div className="flex items-center justify-between w-full h-12 bg-primary/20 border border-primary/50 rounded-xl px-3 text-white">
                  <span className="truncate font-bold">{products.find((p:any) => p.id === productId)?.name}</span>
                  <button type="button" onClick={() => { setProductId(''); setProductSearch(''); }} className="text-primary hover:text-white text-sm font-bold bg-black/20 px-3 py-1 rounded-lg">Cambiar</button>
                </div>
              ) : (
                <div className="relative">
                  <Input 
                    value={productSearch} 
                    onChange={e => {
                      setProductSearch(e.target.value)
                      setIsDropdownOpen(true)
                    }} 
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Escribe el nombre o escanea el código de barras..." 
                    className="h-12 bg-zinc-900/50 rounded-xl focus-visible:ring-primary" 
                  />
                  {isDropdownOpen && productSearch && (
                    <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-zinc-800 border border-white/10 rounded-xl shadow-2xl">
                      {products
                        .filter((p: any) => 
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(productSearch))
                        )
                        .slice(0, 20)
                        .map((p: any) => (
                          <div 
                            key={p.id} 
                            onClick={() => {
                              setProductId(p.id)
                              setProductSearch('')
                              setIsDropdownOpen(false)
                            }}
                            className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold text-white">{p.name}</div>
                              <div className="text-xs text-zinc-400">
                                {p.barcode ? `Cód: ${p.barcode}` : 'Sin código de barras'}
                              </div>
                            </div>
                            <div className="font-mono text-emerald-400 font-bold">
                              ${p.sellPrice.toFixed(2)}
                            </div>
                          </div>
                      ))}
                      {products.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode && p.barcode.includes(productSearch))).length === 0 && (
                        <div className="p-4 text-zinc-500 text-sm text-center">No se encontraron productos</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Tipo de Promo</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setType('BUY_X_PAY_Y')} className={`h-12 rounded-xl font-bold border transition-all ${type === 'BUY_X_PAY_Y' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/30'}`}>
                  Llevá X, Pagá Y (Ej: 3x2)
                </button>
                <button type="button" onClick={() => setType('QUANTITY_FIXED_PRICE')} className={`h-12 rounded-xl font-bold border transition-all ${type === 'QUANTITY_FIXED_PRICE' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/30'}`}>
                  Cantidad por Precio Fijo
                </button>
              </div>
            </div>

            {type === 'BUY_X_PAY_Y' && (
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Cantidad requerida (X)</label>
                  <Input type="number" min="2" required value={buyQuantity} onChange={e => setBuyQuantity(Number(e.target.value))} className="bg-zinc-900/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Cantidad cobrada (Y)</label>
                  <Input type="number" min="1" required value={payQuantity} onChange={e => setPayQuantity(Number(e.target.value))} className="bg-zinc-900/50" />
                </div>
                <div className="col-span-2 flex items-start gap-2 text-xs text-zinc-500 mt-2">
                  <Info className="h-4 w-4 text-blue-400 shrink-0" />
                  <p>Si pones Llevá 3 Pagá 2, cada vez que la caja junte 3 productos iguales, solo cobrará 2 de ellos automáticamente.</p>
                </div>
              </div>
            )}

            {type === 'QUANTITY_FIXED_PRICE' && (
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Cantidad (X)</label>
                  <Input type="number" min="2" required value={buyQuantity} onChange={e => setBuyQuantity(Number(e.target.value))} className="bg-zinc-900/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Precio Fijo Total</label>
                  <Input type="number" min="1" step="0.01" required value={fixedPrice} onChange={e => setFixedPrice(Number(e.target.value))} className="bg-zinc-900/50" />
                </div>
                <div className="col-span-2 flex items-start gap-2 text-xs text-zinc-500 mt-2">
                  <Info className="h-4 w-4 text-blue-400 shrink-0" />
                  <p>Por ejemplo, 2 por $500. Al llegar a 2 unidades iguales, el subtotal de ambas será $500.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPromo.isPending} className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                {createPromo.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar Promoción'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
