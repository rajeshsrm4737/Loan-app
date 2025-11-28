import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { logAudit } from '../lib/auditLog';
import { parseCSV } from '../lib/csvExport';
import Layout from '../components/Layout';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface BankTransaction {
  transaction_id: string;
  amount: string;
  date: string;
  reference?: string;
  matched?: boolean;
  matchedLoanId?: string;
}

export default function Reconciliation() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsed = parseCSV(csvText);

        const bankTransactions: BankTransaction[] = parsed.map((row) => ({
          transaction_id: row.transaction_id || row.TransactionID || row.id || '',
          amount: row.amount || row.Amount || '0',
          date: row.date || row.Date || '',
          reference: row.reference || row.Reference || row.notes || '',
          matched: false,
        }));

        setTransactions(bankTransactions);

        const { data: loansData } = await supabase
          .from('loans')
          .select(`
            *,
            users!loans_user_id_fkey (
              id,
              full_name,
              email
            )
          `)
          .in('status', ['active', 'pending'])
          .order('requested_at', { ascending: false });

        setLoans(loansData || []);
      } catch (error) {
        console.error('File upload error:', error);
        alert('Failed to parse CSV file. Please check the format.');
      } finally {
        setUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleReconcile = async (transactionIndex: number, loanId: string) => {
    setLoading(true);
    try {
      const transaction = transactions[transactionIndex];
      const loan = loans.find((l) => l.id === loanId);

      if (!loan) throw new Error('Loan not found');

      const paymentAmount = parseFloat(transaction.amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error('Invalid payment amount');
      }

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          loan_id: loanId,
          user_id: loan.user_id,
          amount: paymentAmount,
          transaction_id: transaction.transaction_id,
          status: 'completed',
          processed_by: user?.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      const newOutstanding = Math.max(0, loan.outstanding_amount - paymentAmount);
      const newStatus = newOutstanding === 0 ? 'completed' : loan.status;

      await supabase
        .from('loans')
        .update({
          outstanding_amount: newOutstanding,
          status: newStatus,
        })
        .eq('id', loanId);

      const { data: userData } = await supabase
        .from('users')
        .select('outstanding_balance')
        .eq('id', loan.user_id)
        .maybeSingle();

      if (userData) {
        await supabase
          .from('users')
          .update({
            outstanding_balance: Math.max(0, userData.outstanding_balance - paymentAmount),
          })
          .eq('id', loan.user_id);
      }

      await logAudit({
        actorId: user!.id,
        actionType: 'payment_marked_paid',
        targetId: paymentData.id,
        targetType: 'payment',
        metadata: {
          reconciliation: true,
          bank_transaction_id: transaction.transaction_id,
          loan_id: loanId,
        },
      });

      const updatedTransactions = [...transactions];
      updatedTransactions[transactionIndex] = {
        ...transaction,
        matched: true,
        matchedLoanId: loanId,
      };
      setTransactions(updatedTransactions);

      const updatedLoans = loans.filter((l) => l.id !== loanId || newOutstanding > 0);
      setLoans(updatedLoans);

      alert('Payment reconciled successfully');
    } catch (error) {
      console.error('Reconciliation error:', error);
      alert('Failed to reconcile payment');
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Reconciliation</h2>
          <p className="text-gray-600">Match bank transactions with loans</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Upload Bank Transactions</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file with columns: transaction_id, amount, date, reference (optional)
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-2">Processing CSV file...</p>
          )}
        </div>

        {transactions.length > 0 && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {transactions.length} bank transactions. Matched:{' '}
                {transactions.filter((t) => t.matched).length}
              </p>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    transaction.matched
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {transaction.matched ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                        )}
                        <h4 className="font-semibold text-gray-800">
                          Transaction {transaction.transaction_id}
                        </h4>
                        {transaction.matched && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Matched
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Amount: ${parseFloat(transaction.amount).toFixed(2)}</p>
                        <p>Date: {transaction.date}</p>
                        {transaction.reference && <p>Reference: {transaction.reference}</p>}
                      </div>
                    </div>

                    {!transaction.matched && (
                      <div className="w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Match with Loan
                        </label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleReconcile(index, e.target.value);
                            }
                          }}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                        >
                          <option value="">Select loan to match</option>
                          {loans.map((loan) => (
                            <option key={loan.id} value={loan.id}>
                              {loan.users.full_name} - ${loan.outstanding_amount.toFixed(2)} ({loan.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {transactions.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">No transactions uploaded yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Upload a CSV file to start reconciling payments
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
