import { useEffect, useState } from 'react';
import { DollarSign, FileText, Calendar, CreditCard, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

interface DashboardStats {
  outstandingBalance: number;
  activeLoans: number;
  nextDueDate: string | null;
  lastPayment: { amount: number; date: string } | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    outstandingBalance: 0,
    activeLoans: 0,
    nextDueDate: null,
    lastPayment: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['active', 'pending']);

      const activeLoans = loans?.filter(l => l.status === 'active') || [];

      const nextLoan = activeLoans
        .filter(l => l.due_date)
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0];

      const { data: lastPaymentData } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        outstandingBalance: user?.outstanding_balance || 0,
        activeLoans: activeLoans.length,
        nextDueDate: nextLoan?.due_date || null,
        lastPayment: lastPaymentData
          ? { amount: lastPaymentData.amount, date: lastPaymentData.created_at }
          : null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLoan = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/loan-request' }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h2>
          <p className="text-gray-600">Overview of your loans and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-medium text-gray-700">Outstanding Balance</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              ${stats.outstandingBalance.toFixed(2)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-700">Active Loans</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.activeLoans}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-medium text-gray-700">Next Due Date</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.nextDueDate
                ? new Date(stats.nextDueDate).toLocaleDateString()
                : 'No due dates'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-700">Last Payment</h3>
            </div>
            {stats.lastPayment ? (
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  ${stats.lastPayment.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(stats.lastPayment.date).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-xl font-bold text-gray-800">No payments yet</p>
            )}
          </div>
        </div>

        <button
          onClick={handleRequestLoan}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Request New Loan
        </button>
      </div>
    </Layout>
  );
}
