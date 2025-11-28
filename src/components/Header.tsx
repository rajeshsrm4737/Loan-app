import { useEffect, useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../lib/notifications';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (user) {
      try {
        const count = await getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  const handleNotificationClick = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/notices' }));
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">LendTrack</h1>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="text-sm text-gray-600">
              {user.full_name}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
