import { X, LayoutDashboard, History, Calculator, Bell, HelpCircle, Shield, User, LogOut, FileText, ScrollText, GitMerge, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();

  const handleNavigation = (path: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: path }));
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Calculator, label: 'EMI Calculator', path: '/emi-calculator' },
    { icon: Bell, label: 'Notices', path: '/notices' },
    { icon: HelpCircle, label: 'Help/Contact', path: '/help' },
  ];

  const adminMenuItems = [
    { icon: Shield, label: 'Admin Dashboard', path: '/admin' },
    { icon: ScrollText, label: 'Audit Logs', path: '/audit-logs' },
    { icon: FileText, label: 'Reports & Export', path: '/reports' },
    { icon: GitMerge, label: 'Reconciliation', path: '/reconciliation' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin Tools
              </p>
              {adminMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-left"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 mt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-700 hover:bg-red-50 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
