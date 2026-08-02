import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api, type UploadResult } from '@/lib/api'
import { useDashboard } from '@/context/DashboardContext'

const QUERY_KEYS = [
  ['indicators'],
  ['series'],
  ['breakdown'],
  ['ranking'],
  ['data'],
] as const

export function UploadSection() {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { resetFilters } = useDashboard()
  const [uploading, setUploading] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

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
    try {
      const data = await api.upload(file)
      setResult(data)
      const rejected = data.rejected > 0
      toast.success(
        `Importados ${data.imported} registros${rejected ? `, ${data.rejected} rejeitados` : ''}`,
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
      resetFilters()
      toast.success('Todos os dados foram apagados')
      await refreshData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao apagar dados')
    } finally {
      setDropping(false)
    }
  }

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
              <span className="font-medium text-foreground">{result.rejected}</span>
            </span>
            {result.rejected > 0 && (
              <Badge variant="destructive">{Object.keys(result.errors).length} linhas com erro</Badge>
            )}
          </div>
        </>
      )}
    </div>
  )
}
