'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ProductTable, Product } from '@/components/inventory/ProductTable'
import { ProductForm, ProductFormValues } from '@/components/inventory/ProductForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Layers, Loader2, AlertTriangle, Package, TrendingUp, X, Check, Barcode } from 'lucide-react'
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function InventoryClient(props: { userRole: "ADMIN" | "USER" }) {
  return (
    <QueryClientProvider client={queryClient}>
      <InventoryClientInner {...props} />
    </QueryClientProvider>
  )
}

function InventoryClientInner({ userRole }: { userRole: "ADMIN" | "USER" }) {
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showPricePanel, setShowPricePanel] = useState(false)
  const [pricePercentage, setPricePercentage] = useState('')
  const [priceField, setPriceField] = useState<'sellPrice' | 'costPrice' | 'both'>('sellPrice')
  const [applyToFiltered, setApplyToFiltered] = useState(false)
  const [showLowStock, setShowLowStock] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClientHook = useQueryClient()
  const [visibleCount, setVisibleCount] = useState(20)

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Error fetching products')
      return res.json()
    }
  })

  // Extract all unique categories across all products
  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach((p: any) => p.categories?.forEach((c: any) => cats.add(c)))
    return Array.from(cats).sort()
  }, [products])

  // Filter by search query, selected categories, and low stock toggle
  const filteredProducts = useMemo(() => {
    let result = products
    if (showLowStock) {
      result = result.filter(p => p.stock <= p.minStock)
    }
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.some(cat => p.categories?.includes(cat)))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.categories?.some(c => c.toLowerCase().includes(q))
      )
    }
    return result
  }, [products, selectedCategories, searchQuery, showLowStock])

  useEffect(() => {
    setVisibleCount(20)
  }, [searchQuery, selectedCategories, showLowStock])

  const displayedProducts = filteredProducts.slice(0, visibleCount)

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev: string[]) =>
      prev.includes(cat) ? prev.filter((c: string) => c !== cat) : [...prev, cat]
    )
  }

  const createProduct = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      return res.json()
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['products'] })
      setShowForm(false)
      setEditingProduct(undefined)
    },
    onError: (err: Error) => alert('Error: ' + err.message)
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ProductFormValues> & { stock?: number } }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      return res.json()
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['products'] })
      setShowForm(false)
      setEditingProduct(undefined)
    },
    onError: (err: Error) => alert('Error: ' + err.message)
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting product')
    },
    onSuccess: () => queryClientHook.invalidateQueries({ queryKey: ['products'] }),
    onError: (err: Error) => alert('Error: ' + err.message)
  })

  const bulkPriceUpdate = useMutation({
    mutationFn: async ({ productIds, field, percentage }: { productIds: string[], field: string, percentage: number }) => {
      const res = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, field, percentage })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      return res.json()
    },
    onSuccess: (data) => {
      queryClientHook.invalidateQueries({ queryKey: ['products'] })
      alert(`✅ Se actualizaron los precios de ${data.updated} producto(s)`)
      setShowPricePanel(false)
      setPricePercentage('')
    },
    onError: (err: Error) => alert('Error: ' + err.message)
  })

  const handleApplyPriceIncrease = () => {
    const pct = parseFloat(pricePercentage)
    if (isNaN(pct) || pct === 0) { alert('Ingresá un porcentaje válido (puede ser negativo para reducir)'); return }

    const targetProducts = applyToFiltered && selectedCategories.length > 0 ? filteredProducts : products
    if (targetProducts.length === 0) { alert('No hay productos para actualizar'); return }

    const label = applyToFiltered && selectedCategories.length > 0
      ? `los ${targetProducts.length} productos filtrados`
      : `TODOS los ${targetProducts.length} productos`

    const fieldLabel = priceField === 'both' ? 'precio de costo y venta' : priceField === 'sellPrice' ? 'precio de venta' : 'precio de costo'

    if (!confirm(`¿Aplicar ${pct > 0 ? '+' : ''}${pct}% al ${fieldLabel} de ${label}?`)) return

    bulkPriceUpdate.mutate({
      productIds: targetProducts.map(p => p.id),
      field: priceField,
      percentage: pct
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Seguro que querés eliminar "${name}"?`)) deleteProduct.mutate(id)
  }

  const handleSubmit = (data: ProductFormValues) => {
    if (editingProduct) updateProduct.mutate({ id: editingProduct.id, data })
    else createProduct.mutate(data)
  }

  const handleEdit = (product: Product) => { setEditingProduct(product); setShowForm(true) }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al importar')
      alert('✅ ' + data.message)
      queryClientHook.invalidateQueries({ queryKey: ['products'] })
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Stats */}
      {!showForm && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0"><Layers className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground font-medium">Total</p><h3 className="text-xl font-bold">{products.length}</h3></div>
          </div>
          <button
            onClick={() => setShowLowStock(v => !v)}
            className={`glass rounded-xl p-4 border flex items-center gap-3 text-left transition-all hover:scale-[1.02] ${
              showLowStock
                ? 'border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                : 'border-white/5 hover:border-orange-500/30'
            }`}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              showLowStock ? 'bg-orange-500/40 text-orange-300' : 'bg-orange-500/20 text-orange-400'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                Bajo Stock {showLowStock && <span className="text-orange-400 text-[10px] font-bold">● ACTIVO</span>}
              </p>
              <h3 className="text-xl font-bold">{lowStockCount}</h3>
            </div>
          </button>
          <div className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Package className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground font-medium">Categorías</p><h3 className="text-xl font-bold">{allCategories.length}</h3></div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground font-medium">Mostrando</p><h3 className="text-xl font-bold">{filteredProducts.length}</h3></div>
          </div>
        </div>
      )}

      {/* Action bar */}
      {!showForm && (
        <div className="glass rounded-2xl p-3 border border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="w-full sm:flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Barcode className="h-5 w-5 text-primary/70 group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Buscar por nombre, código de barras o categoría..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 bg-zinc-900/50 border-white/10 rounded-xl focus-visible:ring-primary text-lg font-sans"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {userRole === 'ADMIN' && (
              <div className="flex gap-2 w-full sm:w-auto">
                <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <Button
                  variant="outline"
                  disabled={isImporting}
                  className="flex-1 sm:flex-none h-12 rounded-xl border-white/10 bg-transparent hover:bg-white/5 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />} Importar CSV
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 sm:flex-none h-12 rounded-xl border-white/10 bg-transparent hover:bg-white/5 gap-2 ${showPricePanel ? 'border-primary text-primary' : ''}`}
                  onClick={() => setShowPricePanel(v => !v)}
                >
                  <TrendingUp className="h-4 w-4" /> Precios
                </Button>
                <Button
                  className="flex-1 sm:flex-none h-12 rounded-xl px-5 font-semibold shadow-lg shadow-primary/20"
                  onClick={() => { setEditingProduct(undefined); setShowForm(true) }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Nuevo
                </Button>
              </div>
            )}
          </div>

          {/* Category filters */}
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-destructive/50 text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Limpiar filtros
                </button>
              )}
              {allCategories.map(cat => {
                const isActive = selectedCategories.includes(cat)
                const count = products.filter(p => p.categories?.includes(cat)).length
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:border-primary/50 hover:text-white'
                    }`}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {cat}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bulk price panel */}
      {showPricePanel && !showForm && userRole === 'ADMIN' && (
        <div className="glass rounded-2xl p-6 border border-primary/20 shadow-xl shadow-primary/5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Actualización Masiva de Precios</h3>
            </div>
            <button onClick={() => setShowPricePanel(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Porcentaje */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Porcentaje de cambio</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Ej: 10 (o -5 para bajar)"
                  value={pricePercentage}
                  onChange={e => setPricePercentage(e.target.value)}
                  className="bg-zinc-900/50 border-white/10 h-11 focus-visible:ring-primary rounded-xl pr-8 font-mono text-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
              </div>
              {pricePercentage && !isNaN(parseFloat(pricePercentage)) && (
                <p className="text-xs text-zinc-500">
                  Un producto de $1000 quedaría en <strong className={parseFloat(pricePercentage) >= 0 ? 'text-emerald-400' : 'text-destructive'}>
                    ${(1000 * (1 + parseFloat(pricePercentage) / 100)).toFixed(2)}
                  </strong>
                </p>
              )}
            </div>

            {/* Campo a actualizar */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Aplicar a</label>
              <div className="flex gap-2">
                {(['sellPrice', 'costPrice', 'both'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setPriceField(f)}
                    className={`flex-1 h-11 rounded-xl text-xs font-semibold border transition-all ${
                      priceField === f
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-primary/50'
                    }`}
                  >
                    {f === 'sellPrice' ? 'Precio Venta' : f === 'costPrice' ? 'Precio Costo' : 'Ambos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Alcance</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setApplyToFiltered(false)}
                  className={`flex-1 h-11 rounded-xl text-xs font-semibold border transition-all ${
                    !applyToFiltered
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-primary/50'
                  }`}
                >
                  Todos ({products.length})
                </button>
                <button
                  onClick={() => setApplyToFiltered(true)}
                  disabled={selectedCategories.length === 0}
                  className={`flex-1 h-11 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    applyToFiltered
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-primary/50'
                  }`}
                >
                  Filtrados ({filteredProducts.length})
                </button>
              </div>
              {selectedCategories.length === 0 && (
                <p className="text-[10px] text-zinc-600">Seleccioná una categoría para aplicar solo a filtrados</p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleApplyPriceIncrease}
              disabled={!pricePercentage || bulkPriceUpdate.isPending}
              className="h-11 rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
            >
              {bulkPriceUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><TrendingUp className="mr-2 h-4 w-4" /> Aplicar cambio de precios</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Form or table */}
      {showForm && userRole === 'ADMIN' ? (
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/5 shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              {editingProduct ? <Package className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </div>
            <h2 className="text-2xl font-bold">
              {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            </h2>
          </div>
          <ProductForm
            initialData={editingProduct}
            existingCategories={allCategories}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingProduct(undefined) }}
          />
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
          {selectedCategories.length > 0 && filteredProducts.length < products.length && (
            <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm text-primary font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Mostrando {filteredProducts.length} de {products.length} productos · filtrado por: {selectedCategories.join(', ')}
            </div>
          )}
          <ProductTable
            products={displayedProducts}
            userRole={userRole}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSell={() => window.location.href = '/pos'}
          />
          {visibleCount < filteredProducts.length && (
            <div className="p-4 flex justify-center border-t border-white/5 bg-zinc-900/20">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(v => v + 20)}
                className="rounded-xl border-white/10 hover:bg-white/5 shadow-lg"
              >
                Cargar más productos ({filteredProducts.length - visibleCount} ocultos)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
