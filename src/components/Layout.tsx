import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  ShieldCheck, 
  ClipboardList, 
  LogOut,
  Menu,
  X,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  path: string;
  minRole: 'USER' | 'MENTOR' | 'OWNER';
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, signOut, isOwner, isMentor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: BarChart3, path: '/', minRole: 'USER' },
    { name: 'Database', icon: Database, path: '/database', minRole: 'MENTOR' },
    { name: 'Attendance', icon: ClipboardList, path: '/attendance', minRole: 'OWNER' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between z-50">
        <h1 className="text-2xl text-saffron-dark font-serif font-bold">ISKCON</h1>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="text-stone-600 focus:outline-none p-1"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence mode="wait">
        {(isMenuOpen || true) && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col pt-20 md:pt-0 md:relative transition-transform duration-300",
              !isMenuOpen && "hidden md:flex"
            )}
          >
            <div className="p-8 hidden md:block">
              <h1 className="text-3xl text-saffron-dark font-serif font-bold border-b-2 border-gold pb-2">ISKCON</h1>
              <p className="text-xs text-stone-400 mt-2 tracking-widest uppercase font-medium">Seva Management</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 md:mt-0">
              {menuItems.map((item) => {
                if (item.minRole === 'OWNER' && !isOwner) return null;
                if (item.minRole === 'MENTOR' && !isMentor) return null;

                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                      isActive 
                        ? "bg-saffron text-white shadow-md shadow-saffron/20" 
                        : "text-stone-600 hover:bg-saffron/5 hover:text-saffron-dark"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Profile Summary & Logout */}
            <div className="p-4 border-t border-stone-100 bg-white">
              <div className="bg-stone-50 rounded-2xl p-4 mb-4">
                <p className="text-sm font-bold text-stone-800 truncate">
                  {profile?.displayName || 'Sevak'}
                </p>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-1 capitalize">
                  <ShieldCheck size={12} className="text-saffron" />
                  {profile?.role?.toLowerCase() || 'user'} level
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for Mobile Sidebar */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;