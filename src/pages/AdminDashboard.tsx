import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { logAudit } from '../lib/auditLog';
import Layout from '../components/Layout';
import { CheckCircle, XCircle, Upload } from 'lucide-react';

interface LoanWithUser {
  id: string;
  amount: number;
  outstanding_amount: number;
  status: string;
  due_date: string | null;
  users: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface MarkPaidModalProps {
  loan: LoanWithUser;
  onClose: () => void;
  onSuccess: () => void;
}

function MarkPaidModal({ loan, onClose, onSuccess }: MarkPaidModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error('Invalid amount');
      }

      if (paymentAmount > loan.outstanding_amount) {
        throw new Error('Payment amount cannot exceed outstanding amount');
      }

      let receiptUrl: string | null = null;

      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${loan.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        receiptUrl = urlData.publicUrl;
      }

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          loan_id: loan.id,
          user_id: loan.users.id,
          amount: paymentAmount,
          transaction_id: transactionId,
          status: 'completed',
          processed_by: user?.id,
          receipt_url: receiptUrl,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      const newOutstanding = Math.max(0, loan.outstanding_amount - paymentAmount);
      const newStatus = newOutstanding === 0 ? 'completed' : loan.status;

      const { error: loanError } = await supabase
        .from('loans')
        .update({
          outstanding_amount: newOutstanding,
          status: newStatus,
        })
        .eq('id', loan.id);

      if (loanError) throw loanError;

      const { data: userData } = await supabase
        .from('users')
        .select('outstanding_balance')
        .eq('id', loan.users.id)
        .maybeSingle();

      if (userData) {
        const newUserBalance = Math.max(0, userData.outstanding_balance - paymentAmount);
        await supabase
          .from('users')
          .update({ outstanding_balance: newUserBalance })
          .eq('id', loan.users.id);
      }

      await logAudit({
        actorId: user!.id,
        actionType: 'payment_marked_paid',
        targetId: paymentData.id,
        targetType: 'payment',
        oldValue: { outstanding_amount: loan.outstanding_amount },
        newValue: { outstanding_amount: newOutstanding, payment_amount: paymentAmount },
        metadata: { loan_id: loan.id, transaction_id: transactionId, has_receipt: !!receiptUrl },
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Mark as Paid</h3>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">User: {loan.users.full_name}</p>
          <p className="text-sm text-gray-600">Outstanding: ${loan.outstanding_amount.toFixed(2)}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="TXN123456"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload"
              />
              <label
                htmlFor="receipt-upload"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {receiptFile ? receiptFile.name : 'Upload Receipt'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MarkUnpaidModalProps {
  loan: LoanWithUser;
  onClose: () => void;
  onSuccess: () => void;
}

function MarkUnpaidModal({ loan, onClose, onSuccess }: MarkUnpaidModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('loan_id', loan.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    setPayments(data || []);
    if (data && data.length > 0) {
      setSelectedPaymentId(data[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedPaymentId) {
        throw new Error('No payment selected');
      }

      const selectedPayment = payments.find((p) => p.id === selectedPaymentId);
      if (!selectedPayment) throw new Error('Payment not found');

      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'reversed',
          reversal_reason: reason,
          reversed_at: new Date().toISOString(),
        })
        .eq('id', selectedPaymentId);

      if (paymentError) throw paymentError;

      const newOutstanding = loan.outstanding_amount + selectedPayment.amount;

      const { error: loanError } = await supabase
        .from('loans')
        .update({
          outstanding_amount: newOutstanding,
          status: 'active',
        })
        .eq('id', loan.id);

      if (loanError) throw loanError;

      const { data: userData } = await supabase
        .from('users')
        .select('outstanding_balance')
        .eq('id', loan.users.id)
        .maybeSingle();

      if (userData) {
        await supabase
          .from('users')
          .update({
            outstanding_balance: userData.outstanding_balance + selectedPayment.amount,
          })
          .eq('id', loan.users.id);
      }

      await logAudit({
        actorId: user!.id,
        actionType: 'payment_reversed',
        targetId: selectedPaymentId,
        targetType: 'payment',
        oldValue: { status: 'completed', outstanding_amount: loan.outstanding_amount },
        newValue: { status: 'reversed', outstanding_amount: newOutstanding },
        reason,
        metadata: { loan_id: loan.id, payment_amount: selectedPayment.amount },
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reverse payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Mark as Unpaid</h3>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">User: {loan.users.full_name}</p>
          <p className="text-sm text-gray-600">Outstanding: ${loan.outstanding_amount.toFixed(2)}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {payments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Payment to Reverse
              </label>
              <select
                value={selectedPaymentId}
                onChange={(e) => setSelectedPaymentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {payments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    ${payment.amount.toFixed(2)} - {payment.transaction_id} (
                    {new Date(payment.created_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Reversal
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Select a reason</option>
              <option value="Payment failed">Payment failed</option>
              <option value="Duplicate payment">Duplicate payment</option>
              <option value="Incorrect amount">Incorrect amount</option>
              <option value="Customer request">Customer request</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || payments.length === 0}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface BulkConfirmModalProps {
  type: 'paid' | 'unpaid';
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function BulkConfirmModal({ type, count, onConfirm, onCancel }: BulkConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Bulk {type === 'paid' ? 'Mark as Paid' : 'Mark as Unpaid'}
        </h3>
        <p className="text-gray-600 mb-6">
          You are about to {type === 'paid' ? 'mark' : 'reverse'} {count} loan{count > 1 ? 's' : ''}. This action will affect multiple records.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${
              type === 'paid'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white font-medium py-2 px-4 rounded-lg transition-colors`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithUser | null>(null);
  const [modalType, setModalType] = useState<'paid' | 'unpaid' | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());
  const [bulkModalType, setBulkModalType] = useState<'paid' | 'unpaid' | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLoans();
    }
  }, [user]);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setLoans(data as any || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = (loan: LoanWithUser) => {
    setSelectedLoan(loan);
    setModalType('paid');
  };

  const handleMarkUnpaid = (loan: LoanWithUser) => {
    setSelectedLoan(loan);
    setModalType('unpaid');
  };

  const handleModalClose = () => {
    setSelectedLoan(null);
    setModalType(null);
  };

  const handleSuccess = () => {
    fetchLoans();
    setSelectedLoans(new Set());
  };

  const toggleLoanSelection = (loanId: string) => {
    const newSelected = new Set(selectedLoans);
    if (newSelected.has(loanId)) {
      newSelected.delete(loanId);
    } else {
      newSelected.add(loanId);
    }
    setSelectedLoans(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLoans.size === loans.length) {
      setSelectedLoans(new Set());
    } else {
      setSelectedLoans(new Set(loans.map((l) => l.id)));
    }
  };

  const handleBulkAction = (type: 'paid' | 'unpaid') => {
    if (selectedLoans.size === 0) return;
    setBulkModalType(type);
  };

  const confirmBulkAction = async () => {
    if (!bulkModalType) return;

    try {
      const selectedLoansList = loans.filter((l) => selectedLoans.has(l.id));

      for (const loan of selectedLoansList) {
        if (bulkModalType === 'paid') {
          const paymentAmount = loan.outstanding_amount;

          const { data: paymentData } = await supabase.from('payments').insert({
            loan_id: loan.id,
            user_id: loan.users.id,
            amount: paymentAmount,
            transaction_id: `BULK_${Date.now()}_${loan.id.slice(0, 8)}`,
            status: 'completed',
            processed_by: user?.id,
          }).select().single();

          await supabase.from('loans').update({
            outstanding_amount: 0,
            status: 'completed',
          }).eq('id', loan.id);

          const { data: userData } = await supabase
            .from('users')
            .select('outstanding_balance')
            .eq('id', loan.users.id)
            .maybeSingle();

          if (userData) {
            await supabase.from('users').update({
              outstanding_balance: Math.max(0, userData.outstanding_balance - paymentAmount),
            }).eq('id', loan.users.id);
          }

          if (paymentData) {
            await logAudit({
              actorId: user!.id,
              actionType: 'bulk_payments_marked_paid',
              targetId: paymentData.id,
              targetType: 'payment',
              metadata: { loan_id: loan.id, amount: paymentAmount },
            });
          }
        }
      }

      setBulkModalType(null);
      handleSuccess();
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Bulk action failed. Please try again.');
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
            <p className="text-gray-600">Manage loans and payments</p>
          </div>

          {selectedLoans.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('paid')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Bulk Paid ({selectedLoans.size})
              </button>
            </div>
          )}
        </div>

        {loans.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLoans.size === loans.length && loans.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              Select All
            </label>
          </div>
        )}

        <div className="space-y-3">
          {loans.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">No active or pending loans</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div key={loan.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedLoans.has(loan.id)}
                    onChange={() => toggleLoanSelection(loan.id)}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{loan.users.full_name}</p>
                    <p className="text-sm text-gray-600">{loan.users.email}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Amount: ${loan.amount.toFixed(2)} | Outstanding: $
                        {loan.outstanding_amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">Status: {loan.status}</p>
                      {loan.due_date && (
                        <p className="text-sm text-gray-600">
                          Due: {new Date(loan.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkPaid(loan)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Paid
                    </button>
                    <button
                      onClick={() => handleMarkUnpaid(loan)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Unpaid
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedLoan && modalType === 'paid' && (
        <MarkPaidModal loan={selectedLoan} onClose={handleModalClose} onSuccess={handleSuccess} />
      )}

      {selectedLoan && modalType === 'unpaid' && (
        <MarkUnpaidModal loan={selectedLoan} onClose={handleModalClose} onSuccess={handleSuccess} />
      )}

      {bulkModalType && (
        <BulkConfirmModal
          type={bulkModalType}
          count={selectedLoans.size}
          onConfirm={confirmBulkAction}
          onCancel={() => setBulkModalType(null)}
        />
      )}
    </Layout>
  );
}
