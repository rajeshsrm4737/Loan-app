import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

interface Loan {
  id: string;
  amount: number;
  outstanding_amount: number;
  status: string;
  requested_at: string;
  due_date: string | null;
}

interface Payment {
  id: string;
  amount: number;
  transaction_id: string;
  status: string;
  created_at: string;
  loan_id: string;
}

export default function History() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'loans' | 'payments'>('loans');

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false });

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setLoans(loansData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">History</h2>
          <p className="text-gray-600">View your loan and payment history</p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'loans'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Loans
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Payments
          </button>
        </div>

        {activeTab === 'loans' && (
          <div className="space-y-3">
            {loans.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">No loans found</p>
              </div>
            ) : (
              loans.map((loan) => (
                <div key={loan.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        ${loan.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Outstanding: ${loan.outstanding_amount.toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        loan.status
                      )}`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Requested: {new Date(loan.requested_at).toLocaleDateString()}</p>
                    {loan.due_date && (
                      <p>Due Date: {new Date(loan.due_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">No payments found</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Transaction ID: {payment.transaction_id}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
