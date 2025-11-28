import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import PushNotificationToggle from '../components/PushNotificationToggle';
import { User, Mail, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
          </div>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-800">{user.full_name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-800">{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-800 capitalize">{user.role}</span>
                  {user.role === 'admin' && (
                    <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-700">
                  ${user.outstanding_balance.toFixed(2)}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Account Status</p>
                <p className="text-2xl font-bold text-blue-700">
                  {user.outstanding_balance > 0 ? 'Active' : 'Clear'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>

            <div className="space-y-3">
              <PushNotificationToggle />

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">Email Notifications</p>
                    <p className="text-sm text-gray-600">Always enabled for important updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To update your personal information, please contact support.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
