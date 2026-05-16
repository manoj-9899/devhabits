// src/components/auth/AuthLayout.tsx
import { Link, Outlet } from 'react-router-dom';
import { Card } from '../ui/Card';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#0d1117]">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 bg-[#238636] rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#e6edf3]">DevHabits</h1>
            <p className="text-sm text-[#8b949e] mt-1">Sign in to save habits to your account</p>
          </div>
        </div>

        <Card padding="lg" className="shadow-lg shadow-black/20">
          <Outlet />
        </Card>

        <p className="text-center text-xs text-[#6e7681]">
          <Link to="/" className="text-[#58a6ff] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
