import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PackageOpen, LayoutDashboard, ShoppingCart, LogOut, Package } from "lucide-react"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const isAdmin = session.user.role === "ADMIN"

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      
      {/* Sidebar for Desktop / Topnav for Mobile */}
      <aside className="w-full md:w-64 glass border-r border-white/5 flex flex-col md:h-screen sticky top-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <PackageOpen className="h-6 w-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">Glmodas<span className="text-primary">APP</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto flex md:flex-col overflow-x-auto md:overflow-x-visible">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
            <LayoutDashboard className="h-5 w-5" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          
          <Link href="/pos" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden md:inline">Caja / Cobrar</span>
          </Link>
          
          <Link href="/inventory" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
            <Package className="h-5 w-5" />
            <span className="hidden md:inline">Inventario</span>
          </Link>
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">{session.user.name}</span>
              <span className="text-xs text-primary font-medium">{session.user.role}</span>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-zinc-400 hover:text-white transition-colors h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10">
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
