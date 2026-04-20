import { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function AdminGate({ children }) {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Default password set to 'admin123' as per implementation plan
  const ADMIN_PASSWORD = 'admin123';

  // Persist unlock for the session
  useEffect(() => {
    const unlocked = sessionStorage.getItem('admin_gate_unlocked');
    if (unlocked === 'true') {
      setIsAdminUnlocked(true);
    }
  }, []);

  function handleUnlock(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAdminUnlocked(true);
      sessionStorage.setItem('admin_gate_unlocked', 'true');
      setError('');
    } else {
      setError('Invalid Access Code');
      setPassword('');
    }
  }

  if (isAdminUnlocked) {
    return children;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md animate-fade-in">
      <div className="orb orb-1 opacity-50" />
      <div className="orb orb-2 opacity-50" />
      
      <div className="w-full max-w-md glass p-8 border border-white/20 animate-scale-in relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent mb-2">
            Restricted Access
          </h2>
          <p className="text-dark-400 text-sm mb-8">
            Please enter the Admin Access Code to continue to the dashboard.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                placeholder="Access Code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-glass pl-12 bg-white/5 border-white/10 focus:border-primary-500/50 ${error ? 'border-red-500/50' : ''}`}
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium animate-shake">
                <ShieldAlert className="w-3 h-3" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 group"
            >
              Verify & Enter 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <p className="mt-8 text-[10px] text-dark-500 uppercase tracking-widest font-bold">
            Security Layer Alpha-7
          </p>
        </div>
      </div>
    </div>
  );
}
