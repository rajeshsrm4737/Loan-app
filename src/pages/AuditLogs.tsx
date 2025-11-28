import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuditLogs } from '../lib/auditLog';
import Layout from '../components/Layout';
import { Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  old_value: any;
  new_value: any;
  reason: string | null;
  metadata: any;
  created_at: string;
  actor: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [user, actionTypeFilter, targetTypeFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({
        actionType: actionTypeFilter || undefined,
        targetType: targetTypeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setActionTypeFilter('');
    setTargetTypeFilter('');
    setStartDate('');
    setEndDate('');
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Audit Logs</h2>
          <p className="text-gray-600">Track all administrative actions</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="payment_marked_paid">Payment Marked Paid</option>
                <option value="payment_reversed">Payment Reversed</option>
                <option value="loan_approved">Loan Approved</option>
                <option value="loan_rejected">Loan Rejected</option>
                <option value="bulk_payments_marked_paid">Bulk Payments Marked Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Type
              </label>
              <select
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="payment">Payment</option>
                <option value="loan">Loan</option>
                <option value="user">User</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {formatActionType(log.action_type)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      By: {log.actor?.full_name || 'System'} ({log.actor?.email || 'system'})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mt-1">
                      {log.target_type}
                    </span>
                  </div>
                </div>

                {log.reason && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Reason:</span> {log.reason}
                    </p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {log.old_value && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Previous State:</p>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.old_value, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_value && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">New State:</p>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.new_value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-gray-700 mb-1 text-sm">Metadata:</p>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
