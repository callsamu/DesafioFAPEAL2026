import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardProvider, useDashboard } from '@/context/DashboardContext'
import { UploadSection } from '@/components/UploadSection'
import { IndicatorsCards } from '@/components/IndicatorsCards'
import { FiltersPanel } from '@/components/FiltersPanel'
import { SeriesTab } from '@/components/SeriesTab'
import { BreakdownTab } from '@/components/BreakdownTab'
import { DataTable } from '@/components/DataTable'

function Dashboard() {
  const { error } = useDashboard()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Painel de Dados</h1>
        <UploadSection />
      </header>

      {error && (
        <Badge variant="destructive" className="justify-self-start whitespace-normal text-left">
          {error}
        </Badge>
      )}

      <IndicatorsCards />
      <FiltersPanel />

      <Tabs defaultValue="series">
        <TabsList>
          <TabsTrigger value="series">Série</TabsTrigger>
          <TabsTrigger value="breakdown">Rede</TabsTrigger>
        </TabsList>
        <TabsContent value="series">
          <SeriesTab />
        </TabsContent>
        <TabsContent value="breakdown">
          <BreakdownTab />
        </TabsContent>
      </Tabs>

      <DataTable />
    </main>
  )
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider>
        <Dashboard />
        <Toaster position="top-right" />
      </DashboardProvider>
    </QueryClientProvider>
  )
}
