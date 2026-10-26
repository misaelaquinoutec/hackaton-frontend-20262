import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import type { Field } from '../components/AuthForm'
import { LoadingBlock } from '../components/RequestStatus'
import type { FromState } from '../components/RequireAuth'
import { useAuth } from '../lib/auth'
import { toFormFailure } from '../lib/authForm'
import type { FormFailure } from '../lib/authForm'

const fields: Field[] = [
  { name: 'email', label: 'Email de la tripulación', type: 'email', autoComplete: 'username' },
  { name: 'password', label: 'Contraseña', type: 'password', autoComplete: 'current-password' },
]

export default function LoginPage() {
  const { state, login } = useAuth()
  const location = useLocation()
  const from = (location.state as FromState | null)?.from ?? '/dashboard'
  const [values, setValues] = useState({ email: '', password: '' })
  const [failure, setFailure] = useState<FormFailure>({ fieldErrors: {}, formError: null })
  const [submitting, setSubmitting] = useState(false)

  if (state.status === 'loading') return <LoadingBlock label="Verificando sesión…" />
  if (state.status === 'authenticated') return <Navigate to={from} replace />

  const onSubmit = async () => {
    const fieldErrors: Record<string, string> = {}
    if (!values.email.trim()) fieldErrors.email = 'Ingresa el email.'
    if (!values.password) fieldErrors.password = 'Ingresa la contraseña.'
    if (Object.keys(fieldErrors).length > 0) {
      setFailure({ fieldErrors, formError: null })
      return
    }
    setSubmitting(true)
    setFailure({ fieldErrors: {}, formError: null })
    try {
      await login(values.email.trim(), values.password)
    } catch (err) {
      setFailure(toFormFailure(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthForm
      title="Iniciar sesión"
      fields={fields}
      values={values}
      fieldErrors={failure.fieldErrors}
      formError={failure.formError}
      submitting={submitting}
      submitLabel="Entrar"
      onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
      onSubmit={onSubmit}
      footer={{ text: '¿Sin tripulación?', linkTo: '/register', linkLabel: 'Registrarla', state: location.state }}
    />
  )
}
