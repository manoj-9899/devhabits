// src/pages/Login.tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatAuthError } from '../lib/authErrors';

export function Login() {
  const { signIn, configured } = useAuth();
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
    navigate('/', { replace: true });
  }

  if (!configured) {
    return (
      <div className="space-y-3 text-sm text-[#8b949e]">
        <p className="text-[#e6edf3] font-medium">Supabase is not configured yet</p>
        <p>
          Create <code className="text-[#58a6ff]">frontend/.env.local</code> with{' '}
          <code className="text-[#58a6ff]">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-[#58a6ff]">VITE_SUPABASE_ANON_KEY</code>, then restart{' '}
          <code className="text-[#58a6ff]">npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#e6edf3]">Welcome back</h2>
        <p className="text-sm text-[#8b949e] mt-1">Log in with your email and password.</p>
      </div>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error ?? undefined}
      />

      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
        Log in
      </Button>

      <p className="text-center text-sm text-[#8b949e]">
        No account?{' '}
        <Link to="/signup" className="text-[#58a6ff] hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </form>
  );
}
