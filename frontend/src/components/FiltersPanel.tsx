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
  const [syncedFilters, setSyncedFilters] = useState(filters)
  if (filters !== syncedFilters) {
    setSyncedFilters(filters)
    setDraft(filters)
  }

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
      set({ variable, network: DEFAULT_FILTERS.network, level: DEFAULT_FILTERS.level })
    } else {
      set({ variable })
    }
  }

  const options = (key: keyof typeof filterOptions): string[] =>
    (filterOptions[key] ?? []) as string[]

  const years = [...(filterOptions.years ?? [])].sort((a, b) => a - b)

  const setYear = (value: string) => {
    const year = value === '' ? undefined : Number(value)
    set({ year, startYear: undefined, endYear: undefined })
  }

  const setStartYear = (value: string) =>
    set({ startYear: value === '' ? undefined : Number(value) })

  const setEndYear = (value: string) =>
    set({ endYear: value === '' ? undefined : Number(value) })

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
          <Select
            value={draft.year !== undefined ? String(draft.year) : ''}
            onValueChange={setYear}
            disabled={filtersLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Exato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={''}>{''}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>De</Label>
          <Select
            value={draft.startYear !== undefined ? String(draft.startYear) : ''}
            onValueChange={setStartYear}
            disabled={filtersLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Início" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={''}>{''}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Até</Label>
          <Select
            value={draft.endYear !== undefined ? String(draft.endYear) : ''}
            onValueChange={setEndYear}
            disabled={filtersLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Fim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={''}>{''}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Rede</Label>
          {isDemographic === true ? (
            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              Não se aplica
              <span className="ml-1.5 text-xs text-muted-foreground/70">(fixado)</span>
            </div>
          ) : (
            <Select value={draft.network} onValueChange={setSelect('network')} disabled={filtersLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Rede" />
              </SelectTrigger>
              <SelectContent>
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
            <Select value={draft.level} onValueChange={setSelect('level')} disabled={filtersLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
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
          <Select value={draft.variable} onValueChange={setVariable} disabled={filtersLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Variável" />
            </SelectTrigger>
            <SelectContent>
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
