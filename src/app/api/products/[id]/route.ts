import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Build update object dynamically — only include fields that were actually sent
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.barcode !== undefined) updateData.barcode = data.barcode || null
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice
    if (data.sellPrice !== undefined) updateData.sellPrice = data.sellPrice
    if (data.stock !== undefined) updateData.stock = data.stock
    if (data.minStock !== undefined) updateData.minStock = data.minStock
    if (data.categories !== undefined) updateData.categories = data.categories

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
