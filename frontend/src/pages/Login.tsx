import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui';
import { IconPin, IconShield, IconUser } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    role: 'Tourist',
    email: 'tourist@tournexus.in',
    password: 'tourist123',
    icon: IconUser,
    blurb: 'Plan a trip, see disruptions, get adapted itineraries.',
  },
  {
    role: 'Authority',
    email: 'authority@tournexus.in',
    password: 'authority123',
    icon: IconShield,
    blurb: 'Monitor the destination, trace ripples, rank interventions.',
  },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const signedIn = await login(email, password);
      navigate(signedIn.role === 'authority' ? '/authority' : '/app', {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  function useDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Story panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(40rem 30rem at 20% 20%, rgba(99,102,241,0.22), transparent 60%),' +
              'radial-gradient(35rem 25rem at 80% 80%, rgba(14,165,233,0.18), transparent 60%)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-info shadow-lg shadow-brand-600/30">
            <IconPin className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            TourNexus
          </span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white">
            When one service breaks,
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-info bg-clip-text text-transparent">
              everything downstream shifts.
            </span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-mist-300">
            TourNexus models a destination as a dependency graph, traces how
            pressure on one service cascades to the rest, and ranks the
            interventions worth spending on.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-[11px] text-mist-400">
            {['Parking', 'Road', 'Transport', 'Attraction', 'Sanitation'].map(
              (node, index, all) => (
                <span key={node} className="flex items-center gap-2">
                  <span className="rounded-lg border border-line bg-ink-800/70 px-2.5 py-1.5 text-mist-200">
                    {node}
                  </span>
                  {index < all.length - 1 && (
                    <span className="text-brand-400">→</span>
                  )}
                </span>
              ),
            )}
          </div>
        </div>

        <p className="relative text-xs text-mist-500">
          Smart India Hackathon 2026 · Dependency-Aware Tourism Intelligence
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-info">
              <IconPin className="h-5 w-5 text-white" />
            </span>
            <p className="text-lg font-extrabold text-white">TourNexus</p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-mist-400">
            Use a demo account below, or your own credentials.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
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
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs leading-relaxed text-danger"
              >
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-500">
              Demo accounts
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => useDemo(account)}
                className="panel panel-hover flex w-full items-center gap-3 p-3 text-left"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
                  <account.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-white">
                    {account.role}
                  </span>
                  <span className="block truncate text-[11px] text-mist-400">
                    {account.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="mt-7 text-center text-xs text-mist-400">
            No account yet?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-300 hover:text-brand-200"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-mist-300"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-ink-850 px-3.5 py-2.5 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
      {hint && <p className="mt-1.5 text-[11px] text-mist-500">{hint}</p>}
    </div>
  );
}
