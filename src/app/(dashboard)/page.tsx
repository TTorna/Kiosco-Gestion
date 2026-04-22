import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TrendingUp, Users, PackageX, DollarSign } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: 'Dashboard - Kiosko App'
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  // Si no es admin, redirigir a caja
  if (session.user.role !== "ADMIN") {
    redirect('/pos')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let salesToday = 0
  let customersToday = 0
  let salesYesterday = 0
  let lowStockItems = 0

  try {
    // Ventas de hoy
    const salesTodayAggr = await prisma.sale.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { createdAt: { gte: today } }
    })
    salesToday = salesTodayAggr._sum.total || 0
    customersToday = salesTodayAggr._count.id || 0

    // Ventas de ayer
    const salesYesterdayAggr = await prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: yesterday, lt: today } }
    })
    salesYesterday = salesYesterdayAggr._sum.total || 0

    // Productos con bajo stock (compara dos columnas con raw query)
    const lowStockResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int as count FROM "Product" WHERE stock <= "minStock"
    `
    lowStockItems = Number(lowStockResult[0]?.count ?? 0)
  } catch (e) {
    console.error('Dashboard stats error:', e)
  }

  const stats = { salesToday, salesYesterday, customersToday, lowStockItems }

  const growth = stats.salesYesterday > 0
    ? ((stats.salesToday - stats.salesYesterday) / stats.salesYesterday) * 100
    : (stats.salesToday > 0 ? 100 : 0)


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard General</h1>
        <p className="text-zinc-400 mt-2">Resumen de ventas y estadísticas de tu negocio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ingresos Hoy */}
        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Ingresos Hoy</p>
              <h3 className="text-2xl font-bold text-white">${stats.salesToday.toLocaleString('es-AR')}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-semibold ${growth >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
            <span className="text-zinc-500">vs ayer</span>
          </div>
        </div>

        {/* Clientes Hoy */}
        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Transacciones Hoy</p>
              <h3 className="text-2xl font-bold text-white">{stats.customersToday}</h3>
            </div>
          </div>
        </div>

        {/* Alertas Stock */}
        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shadow-inner">
              <PackageX className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Bajo Stock</p>
              <h3 className="text-2xl font-bold text-white">{stats.lowStockItems} productos</h3>
            </div>
          </div>
        </div>
        
        {/* Rendimiento Semanal */}
        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Tendencia Semanal</p>
              <h3 className="text-2xl font-bold text-white">Positiva</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Placeholder para gráfico futuro */}
      <div className="glass rounded-2xl p-8 border border-white/5 h-96 flex items-center justify-center flex-col text-center">
        <TrendingUp className="h-16 w-16 text-zinc-700 mb-4" />
        <h3 className="text-xl font-bold text-zinc-500">Gráfico de Ventas Semanales</h3>
        <p className="text-zinc-600 mt-2">Aquí implementaremos un gráfico interactivo con Recharts próximamente.</p>
      </div>
    </div>
  )
}
