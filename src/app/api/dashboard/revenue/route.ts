import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const period = req.nextUrl.searchParams.get('period') ?? '7d'
    const now = new Date()
    const data: { name: string; revenue: number; profit: number; transactions: number }[] = []

    if (period === '7d') {
      // Last 7 days grouped by day
      for (let i = 6; i >= 0; i--) {
        const from = new Date(now)
        from.setDate(from.getDate() - i)
        from.setHours(0, 0, 0, 0)
        const to = new Date(from)
        to.setHours(23, 59, 59, 999)

        const sales = await prisma.sale.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: { items: true }
        })

        let revenue = 0
        let profit = 0
        sales.forEach(sale => {
          revenue += sale.total
          sale.items.forEach(item => {
            const cost = item.costPrice ?? 0
            profit += (item.price - cost) * item.quantity
          })
        })

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        data.push({
          name: dayNames[from.getDay()],
          revenue: Math.round(revenue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          transactions: sales.length
        })
      }

    } else if (period === '8w') {
      // Last 8 weeks grouped by week
      for (let i = 7; i >= 0; i--) {
        const from = new Date(now)
        from.setDate(from.getDate() - i * 7 - from.getDay())
        from.setHours(0, 0, 0, 0)
        const to = new Date(from)
        to.setDate(to.getDate() + 6)
        to.setHours(23, 59, 59, 999)

        const sales = await prisma.sale.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: { items: true }
        })

        let revenue = 0
        let profit = 0
        sales.forEach(sale => {
          revenue += sale.total
          sale.items.forEach(item => {
            const cost = item.costPrice ?? 0
            profit += (item.price - cost) * item.quantity
          })
        })

        const weekNum = Math.ceil((from.getDate()) / 7)
        const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
        data.push({
          name: `S${weekNum} ${monthNames[from.getMonth()]}`,
          revenue: Math.round(revenue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          transactions: sales.length
        })
      }

    } else if (period === '12m') {
      // Last 12 months grouped by month
      const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      for (let i = 11; i >= 0; i--) {
        const from = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0)
        const to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999)

        const sales = await prisma.sale.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: { items: { include: { product: { select: { costPrice: true } } } } }
        })

        let revenue = 0
        let profit = 0
        sales.forEach(sale => {
          revenue += sale.total
          sale.items.forEach(item => {
            const cost = item.product?.costPrice ?? 0
            profit += (item.price - cost) * item.quantity
          })
        })

        data.push({
          name: monthNames[from.getMonth()],
          revenue: Math.round(revenue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          transactions: sales.length
        })
      }

    } else if (period === '5y') {
      // Last 5 years grouped by year
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i
        const from = new Date(year, 0, 1, 0, 0, 0, 0)
        const to = new Date(year, 11, 31, 23, 59, 59, 999)

        const sales = await prisma.sale.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: { items: { include: { product: { select: { costPrice: true } } } } }
        })

        let revenue = 0
        let profit = 0
        sales.forEach(sale => {
          revenue += sale.total
          sale.items.forEach(item => {
            const cost = item.product?.costPrice ?? 0
            profit += (item.price - cost) * item.quantity
          })
        })

        data.push({
          name: String(year),
          revenue: Math.round(revenue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          transactions: sales.length
        })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Revenue API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
