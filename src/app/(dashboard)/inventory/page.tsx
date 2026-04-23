import { auth } from "@/lib/auth"
import InventoryClient from "./InventoryClient"

export const metadata = {
  title: 'Inventario - Glmodas APP'
}

export default async function InventoryPage() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestión de Inventario</h1>
        <p className="text-zinc-400 mt-2">Administra tus productos, precios y visualiza el stock.</p>
      </div>
      <InventoryClient userRole={session.user.role as "ADMIN" | "USER"} />
    </div>
  )
}
