import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save, Mail } from 'lucide-react';

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}

interface NotificationTemplate {
  id: string;
  type: string;
  subject: string;
  email_body: string;
  push_body: string;
  in_app_body: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications'>('general');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSettings();
      fetchTemplates();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(
      settings.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleTemplateChange = (
    type: string,
    field: keyof NotificationTemplate,
    value: string
  ) => {
    setTemplates(
      templates.map((t) =>
        t.type === type ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSaveSettings = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('app_settings')
          .update({
            value: setting.value,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('key', setting.key);

        if (error) throw error;
      }

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplates = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      for (const template of templates) {
        const { error } = await supabase
          .from('notification_templates')
          .update({
            subject: template.subject,
            email_body: template.email_body,
            push_body: template.push_body,
            in_app_body: template.in_app_body,
            updated_at: new Date().toISOString(),
          })
          .eq('type', template.type);

        if (error) throw error;
      }

      setSuccess('Templates saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save templates');
    } finally {
      setSaving(false);
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
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-800">Admin Settings</h2>
          </div>
          <p className="text-gray-600">Configure application settings and notifications</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Notification Templates
          </button>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lending Configuration</h3>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {setting.description}
                    </label>
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Key: {setting.key}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {template.type.replace(/_/g, ' ')}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject / Title
                    </label>
                    <input
                      type="text"
                      value={template.subject}
                      onChange={(e) =>
                        handleTemplateChange(template.type, 'subject', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Body
                    </label>
                    <textarea
                      value={template.email_body}
                      onChange={(e) =>
                        handleTemplateChange(template.type, 'email_body', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Push Notification Body
                    </label>
                    <textarea
                      value={template.push_body}
                      onChange={(e) =>
                        handleTemplateChange(template.type, 'push_body', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      In-App Notification Body
                    </label>
                    <textarea
                      value={template.in_app_body}
                      onChange={(e) =>
                        handleTemplateChange(template.type, 'in_app_body', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={3}
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Available Variables:</p>
                    <p className="text-xs text-gray-600 font-mono">
                      Use double curly braces: {'{{'} variable_name {'}}'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Common variables: user_name, amount, due_date, transaction_id, interest_rate, remaining_balance
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6">
              <button
                onClick={handleSaveTemplates}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Templates'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
