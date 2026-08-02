import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/context/DashboardContext'
import { showsAverageNote } from '@/lib/utils'

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

function formatValue(value: number | null | undefined, format: Intl.NumberFormat, suffix = '') {
  if (value === null || value === undefined) return '—'
  return `${format.format(value)}${suffix}`
}

export function IndicatorsCards() {
  const { indicators, indicatorsLoading, filters } = useDashboard()
  const averageNote = showsAverageNote(filters.municipality)

  const cards = [
    {
      title: 'Matrículas',
      description: 'Total de matrículas',
      value: formatValue(indicators?.enrollments, numberFormat),
    },
    {
      title: 'Ofertas / Escolas',
      description: 'Total de escolas',
      value: formatValue(indicators?.offers, numberFormat),
    },
    {
      title: 'Taxa média de aprovação',
      description: averageNote
        ? 'Média ponderada entre os municípios selecionados'
        : 'Média ponderada',
      value: formatValue(indicators?.averageApproval, percentFormat, '%'),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle className="text-lg">{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {indicatorsLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-3xl font-semibold tabular-nums">{card.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
