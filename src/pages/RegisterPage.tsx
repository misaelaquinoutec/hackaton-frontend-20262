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
  { name: 'teamName', label: 'Nombre de la tripulación (3 a 40 caracteres)', type: 'text', autoComplete: 'organization' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Contraseña (8 a 72 caracteres)', type: 'password', autoComplete: 'new-password' },
]

export default function RegisterPage() {
  const { state, register } = useAuth()
  const location = useLocation()
  const from = (location.state as FromState | null)?.from ?? '/dashboard'
  const [values, setValues] = useState({ teamName: '', email: '', password: '' })
  const [failure, setFailure] = useState<FormFailure>({ fieldErrors: {}, formError: null })
  const [submitting, setSubmitting] = useState(false)

  if (state.status === 'loading') return <LoadingBlock label="Verificando sesión…" />
  if (state.status === 'authenticated') return <Navigate to={from} replace />

  const onSubmit = async () => {
    const fieldErrors: Record<string, string> = {}
    const name = values.teamName.trim()
    if (name.length < 3 || name.length > 40) fieldErrors.teamName = 'El nombre debe tener entre 3 y 40 caracteres.'
    if (!/^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/.test(values.email)) fieldErrors.email = 'Ingresa un email válido.'
    if (values.password.length < 8 || values.password.length > 72) {
      fieldErrors.password = 'La contraseña debe tener entre 8 y 72 caracteres.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      setFailure({ fieldErrors, formError: null })
      return
    }
    setSubmitting(true)
    setFailure({ fieldErrors: {}, formError: null })
    try {
      await register(name, values.email.trim(), values.password)
    } catch (err) {
      setFailure(toFormFailure(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthForm
      title="Registrar tripulación"
      fields={fields}
      values={values}
      fieldErrors={failure.fieldErrors}
      formError={failure.formError}
      submitting={submitting}
      submitLabel="Zarpar"
      onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
      onSubmit={onSubmit}
      footer={{ text: '¿Ya tienen cuenta?', linkTo: '/login', linkLabel: 'Iniciar sesión', state: location.state }}
    />
  )
}
