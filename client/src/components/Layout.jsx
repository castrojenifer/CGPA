import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Calculator,
  Target,
  BarChart3,
  FileDown,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/semester', icon: Calculator, label: 'Semester Calc' },
  { to: '/goal-tracker', icon: Target, label: 'Goal Tracker' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/reports', icon: FileDown, label: 'Reports' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/departments', icon: Building2, label: 'Departments' },
  { to: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/admin/students', icon: Users, label: 'Students' },
];

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const links = isAdmin ? adminLinks : (profile ? studentLinks : [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gradient-dark text-white' : 'bg-gradient-light text-dark-900'}`}>
      {/* Animated orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          ${collapsed ? 'w-20' : 'w-72'}
          ${darkMode ? 'glass' : 'glass-light'}
          border-r border-white/10
          flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display text-lg font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                CGPA Calc
              </h1>
              <p className="text-xs text-dark-400 dark:text-dark-400">Academic Tracker</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard' || link.to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
          
          {!profile && !collapsed && (
            <div className="mt-6 px-4 py-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 animate-fade-in">
              <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-2">Authenticated Preview</p>
              <p className="text-[11px] text-dark-400 mb-4 leading-relaxed">Sign in to save records and unlock all features.</p>
              <NavLink to="/login" className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Sign In
              </NavLink>
            </div>
          )}
        </nav>

        {/* Profile & Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {!collapsed && profile && (
            <div className="px-4 py-3 rounded-xl bg-primary-500/10 mb-3">
              <p className="font-semibold text-sm truncate">{profile.full_name || 'User'}</p>
              <p className="text-xs text-dark-400 capitalize">{profile.role}</p>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className={`sidebar-link w-full ${collapsed ? 'justify-center px-3' : ''}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {profile ? (
            <button
              onClick={handleSignOut}
              className={`sidebar-link w-full text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center px-3' : ''}`}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          ) : (
            <NavLink
              to="/login"
              className={`sidebar-link w-full text-primary-400 hover:bg-primary-500/10 ${collapsed ? 'justify-center px-3' : ''}`}
            >
              <LogOut className="w-5 h-5 rotate-180" />
              {!collapsed && <span>Sign In</span>}
            </NavLink>
          )}

          {/* Collapse button - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-link w-full justify-center hidden lg:flex"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Top bar */}
        <header className={`sticky top-0 z-30 ${darkMode ? 'glass' : 'glass-light'} border-b border-white/10 px-6 py-4 flex items-center justify-between`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-lg font-display font-semibold hidden sm:block">
              {isAdmin ? '🛡️ Admin Panel' : (profile ? `Welcome, ${profile.full_name.split(' ')[0]}` : '👋 Welcome, Student')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-primary-500" />}
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
