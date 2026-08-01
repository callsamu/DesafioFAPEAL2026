import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api, type UploadResult } from '@/lib/api'

export function UploadSection() {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

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
      queryClient.invalidateQueries({ queryKey: ['filters'] })
      queryClient.invalidateQueries({ queryKey: ['indicators'] })
      queryClient.invalidateQueries({ queryKey: ['series'] })
      queryClient.invalidateQueries({ queryKey: ['breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['data'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha no upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
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
