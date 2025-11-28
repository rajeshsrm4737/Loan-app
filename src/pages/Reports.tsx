import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { exportToCSV } from '../lib/csvExport';
import Layout from '../components/Layout';
import { Download, FileText } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'user')
      .order('full_name');
    setUsers(data || []);
  };

  const exportAllLoans = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from('loans')
        .select(`
          id,
          amount,
          outstanding_amount,
          interest_rate,
          status,
          requested_at,
          approved_at,
          due_date,
          users!loans_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('requested_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const formattedData = data.map((loan: any) => ({
        loan_id: loan.id,
        user_name: loan.users.full_name,
        user_email: loan.users.email,
        amount: loan.amount,
        outstanding_amount: loan.outstanding_amount,
        interest_rate: loan.interest_rate,
        status: loan.status,
        requested_at: loan.requested_at,
        approved_at: loan.approved_at || '',
        due_date: loan.due_date || '',
      }));

      exportToCSV(formattedData, 'all_loans');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export loans');
    } finally {
      setLoading(false);
    }
  };

  const exportAllPayments = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          transaction_id,
          status,
          reversal_reason,
          created_at,
          reversed_at,
          receipt_url,
          users!payments_user_id_fkey (
            full_name,
            email
          ),
          loans!payments_loan_id_fkey (
            id,
            amount
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const formattedData = data.map((payment: any) => ({
        payment_id: payment.id,
        user_name: payment.users.full_name,
        user_email: payment.users.email,
        loan_id: payment.loans.id,
        loan_amount: payment.loans.amount,
        payment_amount: payment.amount,
        transaction_id: payment.transaction_id,
        status: payment.status,
        created_at: payment.created_at,
        reversal_reason: payment.reversal_reason || '',
        reversed_at: payment.reversed_at || '',
        has_receipt: payment.receipt_url ? 'Yes' : 'No',
      }));

      exportToCSV(formattedData, 'all_payments');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export payments');
    } finally {
      setLoading(false);
    }
  };

  const exportUserReport = async () => {
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', selectedUserId)
        .single();

      const { data: loansData } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('requested_at', { ascending: false });

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('created_at', { ascending: false });

      const reportData = [
        {
          section: 'USER INFO',
          full_name: userData.full_name,
          email: userData.email,
          outstanding_balance: userData.outstanding_balance,
          total_loans: loansData?.length || 0,
          total_payments: paymentsData?.length || 0,
        },
        ...loansData.map((loan: any) => ({
          section: 'LOAN',
          loan_id: loan.id,
          amount: loan.amount,
          outstanding: loan.outstanding_amount,
          status: loan.status,
          requested: loan.requested_at,
          due_date: loan.due_date || '',
        })),
        ...paymentsData.map((payment: any) => ({
          section: 'PAYMENT',
          payment_id: payment.id,
          loan_id: payment.loan_id,
          amount: payment.amount,
          transaction_id: payment.transaction_id,
          status: payment.status,
          created_at: payment.created_at,
        })),
      ];

      exportToCSV(reportData, `user_report_${userData.full_name.replace(/\s/g, '_')}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export user report');
    } finally {
      setLoading(false);
    }
  };

  const exportDateRangeReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const { data: loansData } = await supabase
        .from('loans')
        .select(`
          *,
          users!loans_user_id_fkey (
            full_name,
            email
          )
        `)
        .gte('requested_at', dateRange.start)
        .lte('requested_at', dateRange.end)
        .order('requested_at', { ascending: false });

      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          users!payments_user_id_fkey (
            full_name,
            email
          )
        `)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: false });

      const reportData = [
        {
          section: 'SUMMARY',
          total_loans: loansData?.length || 0,
          total_payments: paymentsData?.length || 0,
          total_loan_amount: loansData?.reduce((sum: number, l: any) => sum + l.amount, 0) || 0,
          total_payment_amount: paymentsData?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
        },
        ...loansData.map((loan: any) => ({
          section: 'LOAN',
          loan_id: loan.id,
          user_name: loan.users.full_name,
          user_email: loan.users.email,
          amount: loan.amount,
          outstanding: loan.outstanding_amount,
          status: loan.status,
          requested: loan.requested_at,
        })),
        ...paymentsData.map((payment: any) => ({
          section: 'PAYMENT',
          payment_id: payment.id,
          user_name: payment.users.full_name,
          user_email: payment.users.email,
          amount: payment.amount,
          transaction_id: payment.transaction_id,
          status: payment.status,
          created_at: payment.created_at,
        })),
      ];

      exportToCSV(reportData, `date_range_report_${dateRange.start}_to_${dateRange.end}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export date range report');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Access denied. Admin privileges required.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reports & Export</h2>
          <p className="text-gray-600">Export data to CSV format</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">All Loans</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Export all loans with user information, amounts, and status
            </p>
            <button
              onClick={exportAllLoans}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export All Loans
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">All Payments</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Export all payment transactions including reversals and receipts
            </p>
            <button
              onClick={exportAllPayments}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export All Payments
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">User-Specific Report</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Export complete report for a specific user including all loans and payments
            </p>
            <div className="space-y-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                onFocus={() => {
                  if (users.length === 0) fetchUsers();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                onClick={exportUserReport}
                disabled={loading || !selectedUserId}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export User Report
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-800">Date Range Report</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Export loans and payments within a specific date range
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <button
                onClick={exportDateRangeReport}
                disabled={loading || !dateRange.start || !dateRange.end}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export Date Range Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
