import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui';
import { IconPin, IconShield, IconUser } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../lib/types';
import { Field } from './Login';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('tourist');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <Navigate to={user.role === 'authority' ? '/authority' : '/app'} replace />
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const created = await register({
        email,
        password,
        full_name: fullName || undefined,
        role,
      });

      navigate(created.role === 'authority' ? '/authority' : '/app', {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-info shadow-lg shadow-brand-600/25">
          <IconPin className="h-5 w-5 text-white" />
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-mist-400">
          Pick the role you want to explore the platform as.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field
            id="fullName"
            label="Full name"
            value={fullName}
            onChange={setFullName}
            placeholder="Ananya Mishra"
            autoComplete="name"
          />
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="username"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            hint="Minimum 8 characters. Hashed with bcrypt on the server."
          />

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-mist-300">
              Role
            </legend>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { value: 'tourist', label: 'Tourist', icon: IconUser },
                  { value: 'authority', label: 'Authority', icon: IconShield },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-semibold transition ${
                    role === option.value
                      ? 'border-brand-500 bg-brand-500/12 text-brand-300'
                      : 'border-line bg-ink-850 text-mist-300 hover:border-line-strong'
                  }`}
                >
                  <option.icon className="h-[18px] w-[18px]" />
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs leading-relaxed text-danger"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-7 text-center text-xs text-mist-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-300 hover:text-brand-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
