import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'

const SagasPage = lazy(() => import('./pages/SagasPage'))
const SagaStoryPage = lazy(() => import('./pages/SagaStoryPage'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/sagas" replace />} />
        <Route path="/sagas" element={<SagasPage />} />
        <Route path="/sagas/:id" element={<SagaStoryPage />} />
        <Route
          path="*"
          element={
            <main className="p-8">
              <h1 className="text-2xl font-bold">404 · Ruta no encontrada</h1>
              <Link to="/sagas" className="underline">
                Volver
              </Link>
            </main>
          }
        />
      </Routes>
    </Suspense>
  )
}
