// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';
import { AuthLayout } from './components/auth/AuthLayout';
import { Shell } from './components/layout/Shell';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Today } from './pages/Today';
import { Habits } from './pages/Habits';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ROUTES } from './lib/routes';
import { signupEnabled } from './lib/siteMode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.landing} element={<Landing />} />

            <Route element={<GuestRoute />}>
              <Route element={<AuthLayout />}>
                <Route path={ROUTES.login} element={<Login />} />
                {signupEnabled && <Route path={ROUTES.signup} element={<Signup />} />}
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<Shell />}>
                <Route path={ROUTES.app} element={<Dashboard />} />
                <Route path="app/today" element={<Today />} />
                <Route path="app/habits" element={<Habits />} />
                <Route path="app/analytics" element={<Analytics />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
