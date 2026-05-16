// src/pages/Signup.tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Signup() {
  const { signUp, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: signUpError, needsConfirmation } = await signUp(email.trim(), password);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (needsConfirmation) {
      setMessage('Check your email for a confirmation link, then log in.');
      return;
    }

    navigate('/', { replace: true });
  }

  if (!configured) {
    return (
      <div className="space-y-3 text-sm text-[#8b949e]">
        <p className="text-[#e6edf3] font-medium">Supabase is not configured yet</p>
        <p>Add your Supabase keys to <code className="text-[#58a6ff]">frontend/.env.local</code> and restart the dev server.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#e6edf3]">Create account</h2>
        <p className="text-sm text-[#8b949e] mt-1">Your habits will be stored in your own space.</p>
      </div>

      {message && (
        <p className="text-sm text-[#3fb950] bg-[#238636]/10 border border-[#238636]/30 rounded-md px-3 py-2">
          {message}
        </p>
      )}

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
        autoComplete="new-password"
        required
        minLength={6}
        hint="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error ?? undefined}
      />

      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
        Sign up
      </Button>

      <p className="text-center text-sm text-[#8b949e]">
        Already have an account?{' '}
        <Link to="/login" className="text-[#58a6ff] hover:underline font-medium">
          Log in
        </Link>
      </p>
    </form>
  );
}
