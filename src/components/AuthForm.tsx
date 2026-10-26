import { useId } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

export interface Field {
  name: string
  label: string
  type: 'text' | 'email' | 'password'
  autoComplete: string
}

interface Props {
  title: string
  fields: Field[]
  values: Record<string, string>
  fieldErrors: Record<string, string>
  formError: string | null
  submitting: boolean
  submitLabel: string
  onChange: (name: string, value: string) => void
  onSubmit: () => void
  footer: { text: string; linkTo: string; linkLabel: string; state?: unknown }
}

export function AuthForm(p: Props) {
  const uid = useId()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!p.submitting) p.onSubmit()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">{p.title}</h1>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {p.formError && (
          <p role="alert" className="rounded border border-red-400 bg-red-950 p-3 text-red-200">
            {p.formError}
          </p>
        )}
        {p.fields.map((f) => {
          const id = `${uid}-${f.name}`
          const err = p.fieldErrors[f.name]
          return (
            <div key={f.name} className="flex flex-col gap-1">
              <label htmlFor={id} className="text-sm font-medium">
                {f.label}
              </label>
              <input
                id={id}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                value={p.values[f.name] ?? ''}
                onChange={(e) => p.onChange(f.name, e.target.value)}
                aria-invalid={err ? true : undefined}
                aria-describedby={err ? `${id}-err` : undefined}
                className="rounded border border-white/30 bg-slate-900 px-3 py-2 aria-[invalid=true]:border-red-400"
              />
              {err && (
                <p id={`${id}-err`} className="text-sm text-red-300">
                  {err}
                </p>
              )}
            </div>
          )
        })}
        <button
          type="submit"
          disabled={p.submitting}
          className="rounded bg-amber-400 px-4 py-2 font-medium text-slate-900 hover:bg-amber-300 disabled:opacity-60"
        >
          {p.submitting ? 'Enviando…' : p.submitLabel}
        </button>
      </form>
      <p className="text-sm">
        {p.footer.text}{' '}
        <Link to={p.footer.linkTo} state={p.footer.state} className="underline">
          {p.footer.linkLabel}
        </Link>
      </p>
    </main>
  )
}
