
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, History as HistoryIcon, Mic, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string } | null;
  setUser: (u: any) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, setUser, darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const activeClass = "text-purple-600 border-b-2 border-purple-600";
  const inactiveClass = "text-gray-500 hover:text-purple-600 transition-colors";

  if (!user) return <>{children}</>;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`sticky top-0 z-50 px-4 py-3 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Mic className="text-purple-600" />
            <span>GlobalVoice</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-medium">
            <Link to="/" className={location.pathname === '/' ? activeClass : inactiveClass}>
              <div className="flex items-center gap-1"><Home size={18}/> Home</div>
            </Link>
            <Link to="/history" className={location.pathname === '/history' ? activeClass : inactiveClass}>
              <div className="flex items-center gap-1"><HistoryIcon size={18}/> History</div>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-gray-500">Premium User</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className={`mt-auto py-8 text-center border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <p className="text-sm text-gray-500">© 2024 GlobalVoice Multilingual TTS. Powered by Gemini AI.</p>
        <div className="mt-2 flex justify-center gap-4 text-xs text-gray-400">
          <a href="#" className="hover:text-purple-500">Privacy Policy</a>
          <a href="#" className="hover:text-purple-500">Terms of Service</a>
          <a href="#" className="hover:text-purple-500">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
