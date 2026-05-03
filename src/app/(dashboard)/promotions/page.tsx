import { auth } from "@/lib/auth"
import PromotionsClient from "./PromotionsClient"

export const metadata = {
  title: 'Promociones - Glmodas APP'
}

export default async function PromotionsPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="flex h-full items-center justify-center">
        <h1 className="text-2xl font-bold text-zinc-500">Acceso Denegado</h1>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Promociones</h1>
        <p className="text-zinc-400 mt-2">Configura reglas automáticas de descuento para la caja.</p>
      </div>
      
      <div className="flex-1">
        <PromotionsClient />
      </div>
    </div>
  )
}
