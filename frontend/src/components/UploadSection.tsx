import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, type UploadResult } from '@/lib/api'
import { useDashboard } from '@/context/DashboardContext'

const QUERY_KEYS = [
  ['indicators'],
  ['series'],
  ['breakdown'],
  ['ranking'],
  ['data'],
] as const

function formatRaw(row: Record<string, string>): string {
  return Object.entries(row)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
}

export function UploadSection() {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { resetFilters } = useDashboard()
  const [uploading, setUploading] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['filters'], refetchType: 'all' })
    await Promise.all(
      QUERY_KEYS.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey, refetchType: 'all' }),
      ),
    )
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setResult(null)
    setShowDialog(false)
    try {
      const data = await api.upload(file)
      setResult(data)
      const rejected = data.rejectedRows.length > 0
      toast.success(
        `Importados ${data.imported} registros${rejected ? `, ${data.rejectedRows.length} rejeitados` : ''}`,
      )
      await refreshData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha no upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrop = async () => {
    if (!window.confirm('Apagar todos os registros do banco de dados?')) return
    setDropping(true)
    try {
      await api.drop()
      setResult(null)
      setShowDialog(false)
      resetFilters()
      toast.success('Todos os dados foram apagados')
      await refreshData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao apagar dados')
    } finally {
      setDropping(false)
    }
  }

  const rejectedCount = result?.rejectedRows.length ?? 0

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? 'Enviando…' : 'Enviar CSV'}
      </Button>

      <Button
        variant="outline"
        className="text-destructive"
        onClick={handleDrop}
        disabled={dropping}
      >
        {dropping ? 'Limpando…' : 'Limpar dados'}
      </Button>

      {result && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Lidos: <span className="font-medium text-foreground">{result.read}</span>
            </span>
            <span>
              Importados: <span className="font-medium text-foreground">{result.imported}</span>
            </span>
            <span>
              Rejeitados:{' '}
              <span className="font-medium text-foreground">{rejectedCount}</span>
            </span>
            {rejectedCount > 0 && (
              <Badge
                variant="destructive"
                className="cursor-pointer"
                onClick={() => setShowDialog(true)}
              >
                {rejectedCount} linhas com erro
              </Badge>
            )}
          </div>
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Linhas rejeitadas</DialogTitle>
            <DialogDescription>
              {rejectedCount} linha(s) não foram importadas por falharem na validação.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Linha</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result?.rejectedRows.map((row) => (
                  <TableRow key={row.line}>
                    <TableCell className="font-mono text-muted-foreground">
                      {row.line}
                    </TableCell>
                    <TableCell>
                      <code
                        className="block max-w-52 truncate font-mono text-xs"
                        title={formatRaw(row.raw)}
                      >
                        {formatRaw(row.raw)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-0.5 text-xs text-destructive">
                        {row.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
