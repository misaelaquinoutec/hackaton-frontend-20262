import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const WantedListPage = lazy(() => import('./pages/WantedListPage'))
const WantedDetailPage = lazy(() => import('./pages/WantedDetailPage'))
const SagasPage = lazy(() => import('./pages/SagasPage'))
const SagaStoryPage = lazy(() => import('./pages/SagaStoryPage'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wanted" element={<WantedListPage />} />
          <Route path="/wanted/:id" element={<WantedDetailPage />} />
          <Route path="/sagas" element={<SagasPage />} />
          <Route path="/sagas/:id" element={<SagaStoryPage />} />
        </Route>
        <Route
          path="*"
          element={
            <main className="p-8">
              <h1 className="text-2xl font-bold">404 · Ruta no encontrada</h1>
              <Link to="/dashboard" className="underline">
                Volver al inicio
              </Link>
            </main>
          }
        />
      </Routes>
    </Suspense>
  )
}
