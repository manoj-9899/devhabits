// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function AuthSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-[#30363d] border-t-[#3fb950] animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm text-[#8b949e]">Loading your account…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { session, loading, configured } = useAuth();

  if (!configured) {
    return <Navigate to="/login" replace />;
  }
  if (loading) return <AuthSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { session, loading, configured } = useAuth();

  if (!configured) return <Outlet />;
  if (loading) return <AuthSpinner />;
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}
