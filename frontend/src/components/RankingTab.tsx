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
import { formatMetricValue, isRateVariable } from '@/lib/utils'

export function RankingTab() {
  const { ranking, rankingLoading, filters } = useDashboard()
  const isRate = isRateVariable(filters.variable)
  const averageYears = filters.year === undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ranking por município</CardTitle>
        <CardDescription>
          {filters.variable ?? 'Variável'}
          {averageYears ? ' · média entre os anos selecionados' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {rankingLoading ? (
          <Skeleton className="h-full w-full" />
        ) : !ranking || ranking.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nenhum dado para os filtros selecionados.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ranking}
              layout="vertical"
              margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value: number) => (isRate ? `${value}%` : String(value))}
              />
              <YAxis
                type="category"
                dataKey="municipalityName"
                width={130}
                tickFormatter={(value: string) =>
                  value.length > 18 ? `${value.slice(0, 17)}…` : value
                }
              />
              <Tooltip
                formatter={(value) => formatMetricValue(Number(value), isRate)}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
