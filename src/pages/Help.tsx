import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Mail, Phone, MessageSquare } from 'lucide-react';

export default function Help() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('comments').insert({
        user_id: user?.id,
        message: `[HELP REQUEST] ${message}`,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Help & Contact</h2>
          <p className="text-gray-600">Get in touch with us</p>
        </div>

        <div className="grid gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Email</p>
              <p className="text-gray-600">support@lendtrack.com</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Phone</p>
              <p className="text-gray-600">1-800-LEND-TRK</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Send us a message</h3>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              Message sent successfully! We'll get back to you soon.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Describe your issue or question..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
