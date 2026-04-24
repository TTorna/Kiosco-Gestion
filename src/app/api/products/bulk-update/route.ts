import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productIds, field, percentage } = await req.json()

    if (!productIds?.length || !field || percentage === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!['sellPrice', 'costPrice', 'both'].includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 })
    }

    const multiplier = 1 + (percentage / 100)

    // Fetch current products to compute new prices
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sellPrice: true, costPrice: true }
    })

    // Update each product in a transaction
    await prisma.$transaction(
      products.map((p: any) => {
        const data: Record<string, number> = {}
        if (field === 'sellPrice' || field === 'both') {
          data.sellPrice = Math.round(p.sellPrice * multiplier * 100) / 100
        }
        if (field === 'costPrice' || field === 'both') {
          data.costPrice = Math.round(p.costPrice * multiplier * 100) / 100
        }
        return prisma.product.update({ where: { id: p.id }, data })
      })
    )

    return NextResponse.json({ updated: products.length })
  } catch (error) {
    console.error("Bulk price update error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
