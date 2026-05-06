import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    const text = await file.text();
    
    // Parse CSV
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      // Some CSVs from excel use semicolon
      // Papa.parse auto-detects delimiter usually
    });

    if (result.errors.length > 0 && result.errors[0].code !== 'UndetectableDelimiter') {
      console.error("Papa Parse errors:", result.errors);
      // We'll continue anyway as it might just be a formatting issue on a few rows
    }
    
    console.log("Primer fila parseada:", result.data[0]);

    const products = result.data as any[];
    let count = 0;

    for (const row of products) {
      // Normalizar las llaves de la fila (todo a minúsculas y sin espacios extra)
      const normalizedRow: any = {};
      for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }

      const name = normalizedRow.nombre || normalizedRow.name;
      if (!name) continue;

      const category = normalizedRow.categoria || normalizedRow.category || "";
      const barcode = normalizedRow.barcode || normalizedRow.barra || normalizedRow.codigo || null;
      
      const parsePrice = (val: any) => {
        if (!val) return 0;
        const str = String(val).replace(',', '.').replace(/[^0-9.]/g, '');
        return parseFloat(str) || 0;
      };

      const costPrice = parsePrice(normalizedRow.costo || normalizedRow.costprice || 0);
      const sellPrice = parsePrice(normalizedRow.precio || normalizedRow.sellprice || 0);

      // If barcode exists, try to update
      if (barcode) {
        const existing = await prisma.product.findUnique({ where: { barcode: String(barcode) } });
        if (existing) {
          await prisma.product.update({
            where: { barcode: String(barcode) },
            data: {
              name,
              costPrice: costPrice || existing.costPrice,
              sellPrice: sellPrice || existing.sellPrice,
              categories: category ? [category] : existing.categories,
            }
          });
          count++;
          continue;
        }
      } 
      
      // Check by name
      const existingByName = await prisma.product.findFirst({ where: { name } });
      if (existingByName) {
         await prisma.product.update({
            where: { id: existingByName.id },
            data: {
              barcode: barcode ? String(barcode) : existingByName.barcode,
              costPrice: costPrice || existingByName.costPrice,
              sellPrice: sellPrice || existingByName.sellPrice,
              categories: category && !existingByName.categories.includes(category) ? [...existingByName.categories, category] : existingByName.categories,
            }
          });
          count++;
      } else {
         await prisma.product.create({
            data: {
              name,
              barcode: barcode ? String(barcode) : null,
              costPrice,
              sellPrice,
              categories: category ? [category] : [],
              stock: 0,
            }
         });
         count++;
      }
    }

    return NextResponse.json({ success: true, message: `Se importaron/actualizaron ${count} productos correctamente.` });

  } catch (error: any) {
    console.error("Error importando productos:", error);
    return NextResponse.json({ error: "Error del servidor", details: error.message }, { status: 500 });
  }
}
