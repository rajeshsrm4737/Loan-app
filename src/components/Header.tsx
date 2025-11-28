import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

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
          <div className="text-sm text-gray-600">
            {user.full_name}
          </div>
        )}
      </div>
    </header>
  );
}
