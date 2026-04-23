import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TrendingUp, Users, PackageX, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { DashboardCharts } from "@/components/dashboard/DashboardCharts"

export const metadata = {
  title: 'Dashboard - Glmodas APP'
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== "ADMIN") {
    redirect('/pos')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date(today)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  let salesToday = 0
  let customersToday = 0
  let salesYesterday = 0
  let lowStockItems = 0
  let salesLastMonth = 0
  let salesPrevMonth = 0
  let dailyData: any[] = []
  let topProducts: any[] = []
  let categoryData: any[] = []

  try {
    // 1. Estadísticas básicas
    const salesTodayAggr = await prisma.sale.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { createdAt: { gte: today } }
    })
    salesToday = salesTodayAggr._sum.total || 0
    customersToday = salesTodayAggr._count.id || 0

    const salesYesterdayAggr = await prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: yesterday, lt: today } }
    })
    salesYesterday = salesYesterdayAggr._sum.total || 0

    // Últimos 30 días
    const lastMonthAggr = await prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: thirtyDaysAgo } }
    })
    salesLastMonth = lastMonthAggr._sum.total || 0

    // Los 30 días anteriores a esos (para comparar)
    const prevMonthAggr = await prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
    })
    salesPrevMonth = prevMonthAggr._sum.total || 0

    const lowStockResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int as count FROM "Product" WHERE stock <= "minStock"
    `
    lowStockItems = Number(lowStockResult[0]?.count ?? 0)

    // 2. Datos para el gráfico de 7 días
    const salesLast7Days = await prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' }
    })

    // Agrupar por día
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const dailyMap = new Map()
    
    // Inicializar los 7 días
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      dailyMap.set(dateStr, {
        name: dayNames[d.getDay()],
        revenue: 0,
        transactions: 0
      })
    }

    salesLast7Days.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0]
      if (dailyMap.has(dateStr)) {
        const current = dailyMap.get(dateStr)
        current.revenue += sale.total
        current.transactions += 1
      }
    })
    dailyData = Array.from(dailyMap.values())

    // 3. Productos más vendidos
    const topSales = await prisma.saleItem.groupBy({
      by: ['name'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    })
    topProducts = topSales.map(s => ({
      name: s.name,
      value: s._sum.quantity || 0
    }))

    // 4. Distribución por categoría (Stock)
    const allProducts = await prisma.product.findMany({
      select: { categories: true, stock: true }
    })
    
    const catMap = new Map()
    allProducts.forEach(p => {
      const cats = p.categories && p.categories.length > 0 ? p.categories : ['Sin Categoría']
      cats.forEach(cat => {
        catMap.set(cat, (catMap.get(cat) || 0) + 1)
      })
    })
    categoryData = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

  } catch (e) {
    console.error('Dashboard stats error:', e)
  }

  const growth = salesYesterday > 0
    ? ((salesToday - salesYesterday) / salesYesterday) * 100
    : (salesToday > 0 ? 100 : 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Análisis detallado de movimientos y rendimiento.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <p className="text-sm font-medium text-zinc-400 mb-1">Ingresos Hoy</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold text-white">${salesToday.toLocaleString('es-AR')}</h3>
            <div className={`flex items-center text-xs font-bold mb-1 ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {growth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {Math.abs(growth).toFixed(1)}%
            </div>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(10, growth + 50))}%` }} />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <p className="text-sm font-medium text-zinc-400 mb-1">Transacciones</p>
          <h3 className="text-3xl font-bold text-white">{customersToday}</h3>
          <p className="text-xs text-zinc-500 mt-2">Ventas realizadas en las últimas 24hs</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
          <p className="text-sm font-medium text-zinc-400 mb-1">Alertas Stock</p>
          <h3 className="text-3xl font-bold text-white">{lowStockItems}</h3>
          <p className={`text-xs mt-2 font-medium ${lowStockItems > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
            {lowStockItems > 0 ? 'Requieren reposición inmediata' : 'Todo el stock está al día'}
          </p>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <p className="text-sm font-medium text-zinc-400 mb-1">Ingresos Último Mes</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-bold text-white">${salesLastMonth.toLocaleString('es-AR')}</h3>
            {salesPrevMonth > 0 && (() => {
              const monthGrowth = ((salesLastMonth - salesPrevMonth) / salesPrevMonth) * 100
              return (
                <div className={`flex items-center text-xs font-bold mb-1 ${monthGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {monthGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {Math.abs(monthGrowth).toFixed(1)}%
                </div>
              )
            })()}
          </div>
          <p className="text-xs text-zinc-500 mt-2">vs mes anterior</p>
        </div>
      </div>
      
      {/* Charts Section */}
      <DashboardCharts 
        dailyData={dailyData} 
        topProducts={topProducts} 
        categoryData={categoryData} 
      />
    </div>
  )
}
