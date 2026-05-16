// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';
import { AuthLayout } from './components/auth/AuthLayout';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { Today } from './pages/Today';
import { Habits } from './pages/Habits';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

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
            <Route element={<GuestRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<Shell />}>
                <Route index element={<Dashboard />} />
                <Route path="today" element={<Today />} />
                <Route path="habits" element={<Habits />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
