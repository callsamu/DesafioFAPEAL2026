import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/context/DashboardContext'

const valueFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function DataTable() {
  const { dataPage, dataLoading, page, setPage } = useDashboard()
  const rows = dataPage?.data ?? []
  const hasNext = (dataPage?.data.length ?? 0) >= (dataPage?.size ?? 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Registros</CardTitle>
        <CardDescription>Dados brutos filtrados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum registro para os filtros selecionados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Variável</TableHead>
                <TableHead>Rede</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.year}</TableCell>
                  <TableCell>{row.municipalityName}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.variable}</TableCell>
                  <TableCell>{row.schoolNetwork}</TableCell>
                  <TableCell>{row.educationLevel}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {valueFormat.format(row.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || dataLoading}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext || dataLoading}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
