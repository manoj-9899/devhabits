// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isHostedSite } from '../../lib/siteMode';
import { ROUTES } from '../../lib/routes';

function AuthSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-[#30363d] border-t-[#3fb950] animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm text-[#8b949e]">Loading…</p>
      </div>
    </div>
  );
}

/** Hosted demo site: must be signed in. Local install: no cloud login required. */
export function ProtectedRoute() {
  const { session, loading, configured } = useAuth();

  if (!isHostedSite) {
    return <Outlet />;
  }

  if (!configured) {
    return <Navigate to={ROUTES.landing} replace />;
  }
  if (loading) return <AuthSpinner />;
  if (!session) return <Navigate to={ROUTES.landing} replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { session, loading, configured } = useAuth();

  if (!isHostedSite) return <Outlet />;
  if (!configured) return <Outlet />;
  if (loading) return <AuthSpinner />;
  if (session) return <Navigate to={ROUTES.app} replace />;
  return <Outlet />;
}
