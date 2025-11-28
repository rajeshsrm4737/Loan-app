import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import LoanRequest from './pages/LoanRequest';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Reconciliation from './pages/Reconciliation';

function Router() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentPath(customEvent.detail);
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  switch (currentPath) {
    case '/dashboard':
      return <Dashboard />;
    case '/history':
      return <History />;
    case '/loan-request':
      return <LoanRequest />;
    case '/help':
      return <Help />;
    case '/admin':
      return <AdminDashboard />;
    case '/audit-logs':
      return <AuditLogs />;
    case '/reports':
      return <Reports />;
    case '/reconciliation':
      return <Reconciliation />;
    case '/profile':
      return <Dashboard />;
    case '/chart':
      return <Dashboard />;
    case '/notices':
      return <Dashboard />;
    default:
      return <Dashboard />;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
