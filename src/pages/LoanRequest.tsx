import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createNotification } from '../lib/notifications';
import Layout from '../components/Layout';

export default function LoanRequest() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const loanAmount = parseFloat(amount);
      if (isNaN(loanAmount) || loanAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { error: insertError } = await supabase.from('loans').insert({
        user_id: user?.id,
        amount: loanAmount,
        outstanding_amount: loanAmount,
        status: 'pending',
        interest_rate: 0,
      });

      if (insertError) throw insertError;

      if (purpose.trim()) {
        await supabase.from('comments').insert({
          user_id: user?.id,
          message: `Loan request for $${loanAmount}: ${purpose}`,
        });
      }

      await createNotification({
        userId: user!.id,
        type: 'general',
        title: 'Loan Request Submitted',
        message: `Your loan request for $${loanAmount.toFixed(2)} has been submitted and is pending review.`,
        metadata: { amount: loanAmount },
      });

      setSuccess(true);
      setAmount('');
      setPurpose('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Loan</h2>
          <p className="text-gray-600">Submit a new loan application</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            Loan request submitted successfully! We'll review it shortly.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose (Optional)
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the purpose of this loan..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
