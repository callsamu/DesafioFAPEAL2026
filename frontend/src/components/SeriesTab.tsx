import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export function SeriesTab() {
  const { series, seriesLoading, filters } = useDashboard()
  const isRate = isRateVariable(filters.variable)
  const averageNote = showsAverageNote(filters.municipality)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Série temporal</CardTitle>
        <CardDescription>
          {filters.variable ?? 'Variável'} por ano
          {averageNote ? ' · média entre municípios' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {seriesLoading ? (
          <Skeleton className="h-full w-full" />
        ) : !series || series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nenhum dado para os filtros selecionados.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis
                width={56}
                tickFormatter={(value: number) => (isRate ? `${value}%` : String(value))}
              />
              <Tooltip
                formatter={(value) => formatMetricValue(Number(value), isRate)}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: 'var(--primary)' }}
                activeDot={{ r: 5 }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
