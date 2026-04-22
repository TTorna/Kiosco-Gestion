'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, AlertTriangle, ShoppingCart, Package, Trash2 } from "lucide-react"

export interface Product {
  id: string;
  name: string;
  barcode: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  categories: string[];
}

interface ProductTableProps {
  products: Product[];
  userRole: "ADMIN" | "USER"; 
  onEdit?: (product: Product) => void;
  onDelete?: (id: string, name: string) => void;
  onSell?: (product: Product) => void;
}

export function ProductTable({ 
  products, 
  userRole, 
  onEdit,
  onDelete,
  onSell
}: ProductTableProps) {
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="w-full bg-zinc-950/50 backdrop-blur-md">
      <Table>
        <TableHeader className="bg-zinc-900/80 border-b border-white/5">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-zinc-400 font-semibold py-4">Producto</TableHead>
            <TableHead className="text-zinc-400 font-semibold py-4">Categoría</TableHead>
            {isAdmin && <TableHead className="text-right text-zinc-400 font-semibold py-4">Costo</TableHead>}
            <TableHead className="text-right text-zinc-400 font-semibold py-4">Precio</TableHead>
            <TableHead className="text-center text-zinc-400 font-semibold py-4">Stock</TableHead>
            <TableHead className="text-right text-zinc-400 font-semibold py-4">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isCritical = product.stock <= product.minStock;
            
            return (
              <TableRow key={product.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="font-medium py-4">
                  <div className="flex items-center gap-3">
                    {isCritical ? (
                      <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-xs text-primary font-bold">{product.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold group-hover:text-primary transition-colors">{product.name}</p>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">{product.barcode}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {product.categories?.map(cat => (
                      <Badge key={cat} variant="outline" className="bg-white/5 border-white/10 text-zinc-300 text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                
                {isAdmin && (
                  <TableCell className="text-right text-zinc-500 font-mono">
                    ${product.costPrice.toFixed(2)}
                  </TableCell>
                )}
                
                <TableCell className="text-right">
                  <span className="font-bold text-lg text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/20">
                    ${product.sellPrice.toFixed(2)}
                  </span>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-lg font-bold text-lg border ${
                    isCritical
                      ? 'text-destructive bg-destructive/10 border-destructive/30'
                      : 'text-white bg-white/5 border-white/10'
                  }`}>
                    {product.stock}
                  </div>
                </TableCell>
                
                <TableCell className="text-right space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl transition-transform hover:scale-105"
                    onClick={() => onSell?.(product)}
                  >
                    <ShoppingCart className="h-4 w-4 sm:mr-2" /> 
                    <span className="hidden sm:inline">Vender</span>
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-transparent border-white/10 hover:bg-white/10 rounded-xl"
                      onClick={() => onEdit?.(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-500 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      onClick={() => onDelete?.(product.id, product.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12">
                <div className="flex flex-col items-center justify-center text-zinc-500">
                  <Package className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg">No se encontraron productos.</p>
                  {isAdmin && <p className="text-sm mt-1">Utiliza el botón superior para agregar uno nuevo.</p>}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
