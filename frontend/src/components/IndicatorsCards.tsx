import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/context/DashboardContext'

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const percentFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

function formatValue(value: number | null | undefined, format: Intl.NumberFormat, suffix = '') {
  if (value === null || value === undefined) return '—'
  return `${format.format(value)}${suffix}`
}

export function IndicatorsCards() {
  const { indicators, indicatorsLoading } = useDashboard()

  const cards = [
    {
      title: 'Matrículas',
      description: 'Total de matrículas',
      value: formatValue(indicators?.matriculas, numberFormat),
    },
    {
      title: 'Ofertas / Escolas',
      description: 'Total de escolas',
      value: formatValue(indicators?.ofertasEscolas, numberFormat),
    },
    {
      title: 'Taxa média de aprovação',
      description: 'Média ponderada',
      value: formatValue(indicators?.taxaMediaDeAprovacao, percentFormat, '%'),
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
