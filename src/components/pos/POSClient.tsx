'use client'

import { useState, useRef } from 'react'
import { ScanInput } from '@/components/inventory/ScanInput'
import { Button } from '@/components/ui/button'
import { Trash2, ShoppingCart, Plus, Minus, CreditCard, Banknote, Loader2, Printer, X, Check } from 'lucide-react'

interface POSProduct {
  id: string
  name: string
  barcode: string | null
  sellPrice: number
  stock: number
}

interface CartItem extends POSProduct {
  quantity: number
  subtotal: number
}

interface TicketData {
  items: CartItem[]
  total: number
  paymentMethod: string
  date: Date
  saleNumber: number
}

interface POSClientProps {
  initialProducts: POSProduct[]
}

export default function POSClient({ initialProducts }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [products] = useState<POSProduct[]>(initialProducts)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const ticketRef = useRef<HTMLDivElement>(null)

  const handleScan = (barcode: string) => {
    const product = products.find(p =>
      (p.barcode && p.barcode === barcode) || p.name.toLowerCase().includes(barcode.toLowerCase())
    )

    if (product) {
      if (product.stock <= 0) { alert(`Sin stock: ${product.name}`); return }

      setCart(prev => {
        const existing = prev.find(i => i.id === product.id)
        if (existing) {
          if (existing.quantity >= product.stock) { alert(`Stock máximo: ${product.stock}`); return prev }
          return prev.map(i =>
            i.id === product.id
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.sellPrice }
              : i
          )
        }
        return [...prev, { ...product, quantity: 1, subtotal: product.sellPrice }]
      })
    } else {
      alert('Producto no encontrado')
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== id) return [item]
      const newQty = item.quantity + delta
      if (newQty <= 0) return []
      if (newQty > item.stock) { alert(`Stock disponible: ${item.stock}`); return [item] }
      return [{ ...item, quantity: newQty, subtotal: newQty * item.sellPrice }]
    }))
  }

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id))

  const total = cart.reduce((acc, i) => acc + i.subtotal, 0)
  const itemsCount = cart.reduce((acc, i) => acc + i.quantity, 0)

  const handleCheckout = async (paymentMethod: string) => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.sellPrice, quantity: i.quantity, subtotal: i.subtotal })),
          total
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTicket({
          items: [...cart],
          total,
          paymentMethod,
          date: new Date(),
          saleNumber: data.saleNumber ?? Math.floor(Math.random() * 99999) + 1
        })
        setCart([])
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch {
      alert('Error de conexión al registrar venta.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContents = ticketRef.current?.innerHTML
    if (!printContents) return

    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ticket de Venta</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #000;
              background: #fff;
              padding: 12px;
              width: 72mm;
            }
            .ticket-header { text-align: center; margin-bottom: 10px; }
            .ticket-header h1 { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
            .ticket-header p { font-size: 10px; color: #555; margin-top: 2px; }
            .divider { border: none; border-top: 1px dashed #000; margin: 8px 0; }
            .ticket-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .ticket-row .name { flex: 1; }
            .ticket-row .qty { width: 30px; text-align: center; }
            .ticket-row .price { width: 60px; text-align: right; }
            .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 6px; }
            .footer { text-align: center; font-size: 10px; color: #555; margin-top: 10px; }
            .info-row { display: flex; justify-content: space-between; font-size: 10px; color: #333; margin: 2px 0; }
            .payment-badge { text-align: center; font-size: 11px; font-weight: bold; margin: 6px 0; text-transform: uppercase; }
          </style>
        </head>
        <body>
          ${printContents}
          <script>
            window.onload = function() {
              window.print()
              setTimeout(function() { window.close() }, 500)
            }
          <\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <>
      {/* Ticket Modal */}
      {ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">¡Venta registrada!</h2>
                  <p className="text-xs text-emerald-400 font-medium">Ticket #{String(ticket.saleNumber).padStart(5, '0')}</p>
                </div>
              </div>
              <button onClick={() => setTicket(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ticket preview */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div
                ref={ticketRef}
                className="bg-white text-black rounded-xl p-4 font-mono text-xs shadow-inner"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                {/* Ticket content (also used for printing) */}
                <div className="ticket-header" style={{ textAlign: 'center', marginBottom: 10 }}>
                  <h1 style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 2 }}>KIOSKO APP</h1>
                  <p style={{ fontSize: 10, color: '#555' }}>Sistema de Gestión</p>
                  <p style={{ fontSize: 10, color: '#555' }}>
                    {ticket.date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' '}
                    {ticket.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <hr className="divider" style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />

                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, margin: '2px 0' }}>
                  <span>Ticket N°</span>
                  <span>#{String(ticket.saleNumber).padStart(5, '0')}</span>
                </div>

                <hr className="divider" style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />

                {/* Column headers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>Producto</span>
                  <span style={{ width: 30, textAlign: 'center' }}>Cant</span>
                  <span style={{ width: 65, textAlign: 'right' }}>Subtotal</span>
                </div>

                {ticket.items.map(item => (
                  <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                      <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 130 }}>
                        {item.name}
                      </span>
                      <span style={{ width: 30, textAlign: 'center' }}>{item.quantity}</span>
                      <span style={{ width: 65, textAlign: 'right' }}>${item.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: 9, color: '#666', paddingLeft: 4, marginBottom: 2 }}>
                      ${item.sellPrice.toFixed(2)} c/u
                    </div>
                  </div>
                ))}

                <hr className="divider" style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />

                <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold' }}>
                  <span>TOTAL</span>
                  <span>${ticket.total.toFixed(2)}</span>
                </div>

                <div className="payment-badge" style={{ textAlign: 'center', fontSize: 11, fontWeight: 'bold', margin: '6px 0', textTransform: 'uppercase' }}>
                  Pago: {ticket.paymentMethod}
                </div>

                <hr className="divider" style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />

                <div className="footer" style={{ textAlign: 'center', fontSize: 10, color: '#555', marginTop: 10 }}>
                  <p>¡Gracias por su compra!</p>
                  <p>Vuelva pronto 🙂</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 flex gap-3">
              <Button
                onClick={handlePrint}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
              >
                <Printer className="mr-2 h-5 w-5" /> Imprimir Ticket
              </Button>
              <Button
                variant="outline"
                onClick={() => setTicket(null)}
                className="h-12 px-5 rounded-xl border-white/10 bg-transparent hover:bg-white/5"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* POS Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in slide-in-from-bottom-4 duration-500">

        {/* Izquierda: Escáner y Carrito */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-full">

          <div className="glass rounded-2xl p-4 border border-white/5 shadow-2xl">
            <ScanInput onScan={handleScan} />
            <p className="text-xs text-zinc-500 mt-2 ml-2">Tip: Escanea el código de barras o escribe el nombre del producto.</p>
          </div>

          <div className="glass rounded-2xl border border-white/5 shadow-2xl flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Carrito Actual
              </h2>
              {cart.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full text-zinc-300">
                    {itemsCount} artículo{itemsCount !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => setCart([])} className="text-xs text-zinc-500 hover:text-destructive transition-colors">
                    Vaciar
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60">
                  <ShoppingCart className="h-16 w-16 mb-4" />
                  <p className="text-lg">El carrito está vacío</p>
                  <p className="text-sm mt-1">Escanea productos para agregarlos.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-zinc-900/40 border border-white/5 p-4 rounded-xl hover:bg-zinc-900/80 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base truncate">{item.name}</h3>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">${item.sellPrice.toFixed(2)} c/u</div>
                    </div>

                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-zinc-400 hover:text-white" onClick={() => updateQuantity(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-zinc-400 hover:text-white" onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <span className="font-bold text-lg text-emerald-400 w-20 text-right">${item.subtotal.toFixed(2)}</span>

                      <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Derecha: Resumen y pago */}
        <div className="glass rounded-2xl border border-white/5 shadow-2xl flex flex-col h-full">
          <div className="p-6 border-b border-white/5 bg-zinc-900/50">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5 text-emerald-400" /> Resumen de Pago
            </h2>
          </div>

          <div className="flex-1 p-6 flex flex-col">
            <div className="space-y-3 mb-6">
              {cart.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-4">Sin productos en el carrito</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm text-zinc-400">
                      <span className="truncate flex-1 mr-2">{item.name} ×{item.quantity}</span>
                      <span className="shrink-0">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="h-px w-full bg-white/10 my-2" />

            <div className="flex justify-between items-end my-4">
              <span className="text-xl font-medium text-white">Total</span>
              <span className="text-4xl font-extrabold text-emerald-400 tracking-tighter">
                ${total.toFixed(2)}
              </span>
            </div>

            <div className="mt-auto space-y-3">
              <Button
                className="w-full h-16 text-lg font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                disabled={cart.length === 0 || loading}
                onClick={() => handleCheckout('Efectivo')}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <><Banknote className="mr-2 h-6 w-6" /> Cobrar Efectivo</>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 font-semibold rounded-xl bg-transparent border-white/10 hover:bg-white/5 text-zinc-300"
                disabled={cart.length === 0 || loading}
                onClick={() => handleCheckout('Tarjeta / MP')}
              >
                <CreditCard className="mr-2 h-5 w-5" /> Cobrar Tarjeta / MP
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
