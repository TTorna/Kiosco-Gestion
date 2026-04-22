import { auth } from "@/lib/auth"
import POSClient from "@/components/pos/POSClient"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: 'Caja - Kiosko App'
}

export default async function POSPage() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  // Obtenemos todos los productos para que el cliente pueda escanear de forma instantánea sin peticiones lentas
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      barcode: true,
      sellPrice: true,
      stock: true
    }
  })

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Caja y Facturación</h1>
        <p className="text-zinc-400 mt-2">Escanea productos y realiza el cobro de forma rápida.</p>
      </div>
      
      <div className="flex-1 min-h-[500px]">
        <POSClient initialProducts={products} />
      </div>
    </div>
  )
}
