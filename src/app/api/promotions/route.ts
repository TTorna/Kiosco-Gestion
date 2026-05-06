import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const promotions = await prisma.promotion.findMany({
      include: {
        products: {
          select: { id: true, name: true, sellPrice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(promotions)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        isActive: data.isActive ?? true,
        type: data.type,
        buyQuantity: data.buyQuantity,
        payQuantity: data.payQuantity || null,
        fixedPrice: data.fixedPrice || null,
        products: {
          connect: data.productIds?.map((id: string) => ({ id })) || []
        }
      }
    })
    
    return NextResponse.json(promotion)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
