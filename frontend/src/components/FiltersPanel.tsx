import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DEFAULT_FILTERS, useDashboard } from '@/context/DashboardContext'
import { DEMOGRAPHIC_VARIABLES } from '@/lib/utils'
import type { Filters } from '@/lib/api'

const ALL = '__all__'

function isAll(value: string) {
  return value === ALL
}

export function FiltersPanel() {
  const { filters, updateFilters, resetFilters, filterOptions, filtersLoading } = useDashboard()
  const [draft, setDraft] = useState<Filters>(filters)

  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }))

  const setSelect = (key: keyof Filters) => (value: string) =>
    set({ [key]: isAll(value) ? undefined : value })

  const isDemographic: boolean | null = filtersLoading
    ? null
    : !!(draft.variable && DEMOGRAPHIC_VARIABLES.includes(draft.variable))

  const setVariable = (value: string) => {
    const variable = isAll(value) ? undefined : value
    const wasDemographic = !!(draft.variable && DEMOGRAPHIC_VARIABLES.includes(draft.variable))
    const nextDemographic = !!(variable && DEMOGRAPHIC_VARIABLES.includes(variable))

    if (nextDemographic) {
      set({
        variable,
        network: 'Não se aplica',
        level: 'Pessoas de 15 anos ou mais de idade',
      })
    } else if (wasDemographic) {
      set({ variable, network: filters['network']?.[0], level: filters['level']?.[0] })
    } else {
      set({ variable })
    }
  }

  const options = (key: keyof typeof filterOptions): string[] =>
    (filterOptions[key] ?? []) as string[]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>Filtre os dados exibidos no painel</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-2">
          <Label>Município</Label>
          <Select value={draft.municipality ?? ALL} onValueChange={setSelect('municipality')} disabled={filtersLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Município" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {options('municipalities').map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ano</Label>
          <Input
            type="number"
            placeholder="Exato"
            value={draft.year ?? ''}
            onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : undefined, startYear: undefined, endYear: undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label>De</Label>
          <Input
            type="number"
            placeholder="Início"
            value={draft.startYear ?? ''}
            onChange={(e) => set({ startYear: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label>Até</Label>
          <Input
            type="number"
            placeholder="Fim"
            value={draft.endYear ?? ''}
            onChange={(e) => set({ endYear: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label>Rede</Label>
          {isDemographic === true ? (
            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              Não se aplica
              <span className="ml-1.5 text-xs text-muted-foreground/70">(fixado)</span>
            </div>
          ) : (
            <Select value={draft.network ?? ALL} onValueChange={setSelect('network')} disabled={filtersLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Rede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {options('networks').map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Etapa</Label>
          {isDemographic === true ? (
            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              Pessoas de 15 anos ou mais de idade
              <span className="ml-1.5 text-xs text-muted-foreground/70">(fixado)</span>
            </div>
          ) : (
            <Select value={draft.level ?? ALL} onValueChange={setSelect('level')} disabled={filtersLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {options('levels').map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Variável</Label>
          <Select value={draft.variable ?? ALL} onValueChange={setVariable} disabled={filtersLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Variável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {options('variables').map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2 lg:col-span-2">
          <Button onClick={() => updateFilters(draft)}>Aplicar</Button>
          <Button variant="ghost" onClick={() => { resetFilters(); setDraft(DEFAULT_FILTERS) }}>
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
