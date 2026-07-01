import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoadingSpinner from './components/UI/LoadingSpinner';

import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Billing from './pages/Billing';
import BillDetail from './pages/BillDetail';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

// Security Route Guard
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner text="Checking session authorization..." />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<Dashboard />} />
        <Route path="customers"     element={<Customers />} />
        <Route path="customers/:id" element={<CustomerProfile />} />
        <Route path="billing"       element={<Billing />} />
        <Route path="billing/:id"   element={<BillDetail />} />
        <Route path="payments"      element={<Payments />} />
        <Route path="reports"       element={<Reports />} />
        <Route path="profile"       element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
