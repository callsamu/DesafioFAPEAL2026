import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">shadcn/ui + Vite</h1>
      <Button variant="default" onClick={() => setCount((c) => c + 1)}>
        Count is {count}
      </Button>
    </main>
  )
}

export default App
