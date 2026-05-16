// src/pages/Login.tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatAuthError } from '../lib/authErrors';
import { demoConfigured, isHostedSite, signupEnabled } from '../lib/siteMode';
import { ROUTES } from '../lib/routes';

export function Login() {
  const { signIn, signInDemo, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) {
      setError(formatAuthError(signInError));
      return;
    }
    navigate(ROUTES.app, { replace: true });
  }

  async function handleDemo() {
    setError(null);
    setLoading(true);
    const { error: demoError } = await signInDemo();
    setLoading(false);
    if (demoError) {
      setError(formatAuthError(demoError));
      return;
    }
    navigate(ROUTES.app, { replace: true });
  }

  if (!configured) {
    return (
      <div className="space-y-3 text-sm text-[#8b949e]">
        <p className="text-[#e6edf3] font-medium">Supabase is not configured</p>
        <p>
          On your machine, run <code className="text-[#58a6ff]">npm run dev</code> — no cloud login
          needed. Or add Supabase keys to <code className="text-[#58a6ff]">frontend/.env.local</code>.
        </p>
        <Link to={ROUTES.app} className="text-[#58a6ff] hover:underline text-sm">
          Open local dashboard →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#e6edf3]">
          {isHostedSite ? 'Demo login' : 'Welcome back'}
        </h2>
        <p className="text-sm text-[#8b949e] mt-1">
          {isHostedSite
            ? 'Preview the dashboard. Install locally for your own private data.'
            : 'Log in with your email and password.'}
        </p>
      </div>

      {isHostedSite && demoConfigured && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleDemo}
        >
          Enter demo
        </Button>
      )}

      {isHostedSite && demoConfigured && (
        <p className="text-center text-xs text-[#6e7681]">or sign in with a test account</p>
      )}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required={!isHostedSite}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required={!isHostedSite}
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error ?? undefined}
      />

      <Button type="submit" variant={isHostedSite ? 'secondary' : 'primary'} size="lg" className="w-full" loading={loading}>
        Log in
      </Button>

      <p className="text-center text-sm text-[#8b949e]">
        <Link to={ROUTES.landing} className="text-[#58a6ff] hover:underline">
          ← Install locally
        </Link>
        {signupEnabled && (
          <>
            {' · '}
            <Link to={ROUTES.signup} className="text-[#58a6ff] hover:underline font-medium">
              Sign up
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
