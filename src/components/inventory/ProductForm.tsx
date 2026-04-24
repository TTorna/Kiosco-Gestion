'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Product } from './ProductTable'
import { Save, X, Plus, Tag } from 'lucide-react'

const PRESET_CATEGORIES = [
  'Aguas', 'Bebidas', 'Cervezas', 'Cigarrillos', 'Chocolates', 'Condimentos', 
  'Congelados', 'Enlatados', 'Fiambres', 'Galletitas', 'Gaseosas', 'Golosinas', 
  'Higiene', 'Jugos', 'Lácteos', 'Limpieza', 'Panadería', 'Snacks', 'Vinos',
]

const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  barcode: z.string().optional(),
  costPrice: z.number().min(0, 'El precio no puede ser negativo'),
  sellPrice: z.number().min(0, 'El precio no puede ser negativo'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  minStock: z.number().int().min(0, 'El stock mínimo no puede ser negativo'),
  categories: z.array(z.string()).min(1, 'Seleccioná al menos una categoría'),
})

export type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: Product
  onSubmit: (data: ProductFormValues) => void
  onCancel: () => void
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [customCategory, setCustomCategory] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      barcode: initialData?.barcode || '',
      costPrice: initialData?.costPrice || 0,
      sellPrice: initialData?.sellPrice || 0,
      stock: initialData?.stock || 0,
      minStock: initialData?.minStock || 5,
      categories: initialData?.categories || [],
    },
  })

  const selectedCategories = watch('categories') || []

  // Función para normalizar texto: "bebiDas" -> "Bebidas"
  const normalizeCategory = (cat: string) => {
    const trimmed = cat.trim()
    if (!trimmed) return ""
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
  }


  const toggleCategory = (cat: string) => {
    const normalized = normalizeCategory(cat)
    const current = getValues('categories') || []
    if (current.includes(normalized)) {
      setValue('categories', current.filter((c: string) => c !== normalized), { shouldValidate: true })
    } else {
      setValue('categories', [...current, normalized], { shouldValidate: true })
    }
  }

  const addCustomCategory = () => {
    const normalized = normalizeCategory(customCategory)
    if (!normalized) return
    const current = getValues('categories') || []
    if (!current.includes(normalized)) {
      setValue('categories', [...current, normalized], { shouldValidate: true })
    }
    setCustomCategory('')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-300">Nombre del Producto</Label>
          <Input
            id="name"
            {...register('name')}
            className="bg-zinc-900/50 border-white/10 h-11 focus-visible:ring-primary rounded-xl"
            placeholder="Ej. Coca Cola 2L"
          />
          {errors.name && <p className="text-sm text-destructive font-medium">{errors.name.message}</p>}
        </div>

        {/* Código de barras (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="barcode" className="text-zinc-300">
            Código de Barras <span className="text-zinc-500 font-normal text-xs ml-1">(opcional)</span>
          </Label>
          <Input
            id="barcode"
            {...register('barcode')}
            className="bg-zinc-900/50 border-white/10 h-11 focus-visible:ring-primary rounded-xl font-mono"
            placeholder="Escanea o deja vacío"
          />
        </div>

        {/* Stock actual y mínimo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock" className="text-zinc-300">Stock Actual</Label>
            <Input
              id="stock"
              type="number"
              {...register('stock', { valueAsNumber: true })}
              className="bg-zinc-900/50 border-white/10 h-11 focus-visible:ring-primary rounded-xl"
            />
            {errors.stock && <p className="text-sm text-destructive font-medium">{errors.stock.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStock" className="text-zinc-300">Stock Mínimo</Label>
            <Input
              id="minStock"
              type="number"
              {...register('minStock', { valueAsNumber: true })}
              className="bg-zinc-900/50 border-white/10 h-11 focus-visible:ring-primary rounded-xl"
            />
          </div>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="costPrice" className="text-zinc-300">Precio de Costo ($)</Label>
            <Input
              id="costPrice"
              type="number"
              step="0.01"
              {...register('costPrice', { valueAsNumber: true })}
              className="bg-zinc-900/50 border-white/10 h-11 focus-visible:ring-primary rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellPrice" className="text-zinc-300">Precio de Venta ($)</Label>
            <Input
              id="sellPrice"
              type="number"
              step="0.01"
              {...register('sellPrice', { valueAsNumber: true })}
              className="bg-zinc-900/50 border-primary/50 bg-primary/5 border-white/10 h-11 focus-visible:ring-primary rounded-xl font-mono text-emerald-400 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Categorías - ocupa el ancho completo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-300 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Categorías
          </Label>
          {selectedCategories.length > 0 && (
            <span className="text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded-full border border-white/10">
              {selectedCategories.length} seleccionada{selectedCategories.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Chips de categorías preset */}
        <div className="flex flex-wrap gap-2">
          {PRESET_CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-primary/50 hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Categorías personalizadas añadidas */}
        {selectedCategories.filter(c => !PRESET_CATEGORIES.includes(c)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.filter(c => !PRESET_CATEGORIES.includes(c)).map(cat => (
              <span
                key={cat}
                className="px-3 py-1.5 rounded-full text-sm font-medium border bg-primary text-white border-primary shadow-lg shadow-primary/20 flex items-center gap-1.5"
              >
                {cat}
                <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-red-300 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input para categoría personalizada */}
        <div className="flex gap-2">
          <Input
            placeholder="Otra categoría personalizada..."
            value={customCategory}
            onChange={e => setCustomCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory() } }}
            className="bg-zinc-900/50 border-white/10 h-10 focus-visible:ring-primary rounded-xl text-sm flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomCategory}
            className="h-10 rounded-xl border-white/10 bg-transparent hover:bg-white/5 px-4"
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>

        {errors.categories && (
          <p className="text-sm text-destructive font-medium">{errors.categories.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-white/10">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl border-white/10 bg-transparent hover:bg-white/5 h-11"
        >
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button
          type="submit"
          className="rounded-xl shadow-lg shadow-primary/20 h-11"
        >
          <Save className="mr-2 h-4 w-4" /> Guardar Producto
        </Button>
      </div>
    </form>
  )
}
