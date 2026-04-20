import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, Mail, Sun, Moon, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Password reset link has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gradient-dark text-white' : 'bg-gradient-light text-dark-900'}`}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-xl glass hover:scale-110 transition-all duration-300 z-50"
      >
        {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-primary-500" />}
      </button>

      <div className={`w-full max-w-md ${darkMode ? 'glass' : 'glass-light'} p-8 animate-scale-in relative z-10`}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-dark-400 mt-1 text-center">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glass pl-12"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="spinner w-5 h-5 border-2" />
            ) : (
              <>
                Send Reset Link <Send className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-primary-400 hover:text-primary-300 mt-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </div>
    </div>
  );
}
