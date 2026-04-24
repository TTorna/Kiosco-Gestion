'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Loader2 as LoaderIcon } from 'lucide-react'

interface ChartData {
  name: string
  revenue: number
  transactions: number
}

interface TopProductData {
  name: string
  value: number
}

interface DashboardChartsProps {
  dailyData: ChartData[]
  topProducts: TopProductData[]
  categoryData: { name: string; value: number }[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

type Period = '7d' | '8w' | '12m' | '5y'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d',  label: '7 días'  },
  { value: '8w',  label: '8 semanas' },
  { value: '12m', label: '12 meses' },
  { value: '5y',  label: '5 años'  },
]

export function DashboardCharts({ dailyData, topProducts, categoryData }: DashboardChartsProps) {
  const [period, setPeriod] = useState<Period>('7d')
  const [chartData, setChartData] = useState<ChartData[]>(dailyData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (period === '7d') {
      // Initial data already fetched server-side
      setChartData(dailyData)
      return
    }
    setLoading(true)
    fetch(`/api/dashboard/revenue?period=${period}`)
      .then((r: any) => r.json())
      .then((data: any) => setChartData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period, dailyData])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">

      {/* Gráfico de Ingresos vs Transacciones — con selector de período */}
      <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5 flex flex-col h-[420px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Ingresos vs Transacciones</h3>
            <p className="text-sm text-zinc-500">
              {PERIOD_OPTIONS.find(o => o.value === period)?.label} de historial de ventas
            </p>
          </div>

          {/* Period selector */}
          <div className="flex gap-1 bg-zinc-900/70 border border-white/5 rounded-xl p-1">
            {PERIOD_OPTIONS.map((opt: any) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === opt.value
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl z-10">
              <LoaderIcon className="h-8 w-8 text-emerald-400 animate-spin" />
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) =>
                  name === 'Ingresos' ? [`$${value.toFixed(2)}`, name] : [value, name]
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRev)"
                name="Ingresos"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="transactions"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 2"
                fillOpacity={1}
                fill="url(#colorTx)"
                name="Transacciones"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-400">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-xs text-zinc-400">Transacciones</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Productos Más Vendidos */}
      <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col h-[400px]">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">Productos Populares</h3>
          <p className="text-sm text-zinc-500">Por cantidad vendida (total histórico)</p>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} vertical={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#71717a"
                fontSize={11}
                width={110}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Vendidos" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución por Categoría */}
      <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col h-[400px]">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">Stock por Categoría</h3>
          <p className="text-sm text-zinc-500">Distribución de inventario</p>
        </div>
        <div className="flex-1 w-full flex items-center justify-center">
          <ResponsiveContainer width="70%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {categoryData.slice(0, 5).map((cat: any, i: number) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-zinc-400 truncate max-w-[100px]">{cat.name}</span>
                <span className="text-xs text-zinc-600 ml-auto">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
