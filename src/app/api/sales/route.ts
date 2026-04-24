import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items, total } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 })
    }

    // Process sale using Prisma transaction to ensure atomicity
    const sale = await prisma.$transaction(async (tx: any) => {
      
      // 1. Create the sale
      const newSale = await tx.sale.create({
        data: {
          total: total,
          userId: session.user.id as string,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              subtotal: item.subtotal
            }))
          }
        }
      })

      // 2. Decrement stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      return newSale
    })

    // Get sale number (total count of sales)
    const saleCount = await prisma.sale.count()
    return NextResponse.json({ ...sale, saleNumber: saleCount }, { status: 200 })

  } catch (error) {
    console.error("Error processing sale:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
