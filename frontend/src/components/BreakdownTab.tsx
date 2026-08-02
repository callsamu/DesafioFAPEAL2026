import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/context/DashboardContext'
import { formatMetricValue, isRateVariable, showsAverageNote } from '@/lib/utils'

export function BreakdownTab() {
  const { breakdown, breakdownLoading, filters } = useDashboard()
  const isRate = isRateVariable(filters.variable)
  const averageNote = showsAverageNote(filters.municipality)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição por rede</CardTitle>
        <CardDescription>
          {filters.variable ?? 'Variável'} por rede de ensino
          {averageNote ? ' · média entre municípios' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {breakdownLoading ? (
          <Skeleton className="h-full w-full" />
        ) : !breakdown || breakdown.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nenhum dado para os filtros selecionados.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdown} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="schoolNetwork" tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)} />
              <YAxis
                width={56}
                tickFormatter={(value: number) => (isRate ? `${value}%` : String(value))}
              />
              <Tooltip
                formatter={(value) => formatMetricValue(Number(value), isRate)}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
