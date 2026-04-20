import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Sun, Moon,
  ArrowRight, User, Hash, Building2,
} from 'lucide-react';

export default function Signup() {
  const { signUp } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    registerNumber: '',
    departmentId: '',
    role: 'student',
  });
  const [departments, setDepartments] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const FALLBACK_DEPARTMENTS = [
    { id: 'd1b0e1b0-e1b0-4b0e-8b0e-1b0e1b0e1b01', name: 'Computer Science & Engineering' },
    { id: 'd1b0e1b0-e1b0-4b0e-8b0e-1b0e1b0e1b02', name: 'Information Technology' },
    { id: 'd1b0e1b0-e1b0-4b0e-8b0e-1b0e1b0e1b03', name: 'Artificial Intelligence & Data Science' },
    { id: 'd1b0e1b0-e1b0-4b0e-8b0e-1b0e1b0e1b04', name: 'Electronics & Communication Engineering' },
    { id: 'd1b0e1b0-e1b0-4b0e-8b0e-1b0e1b0e1b05', name: 'Electrical & Electronics Engineering' },
    { id: 'd1b0e1b0-e1b0-4b0e-8b0e-1b0e1b0e1b06', name: 'Mechanical Engineering' },
    { id: 'd1b0e1b0-e1b0-4b0e-8b0e-1b0e1b0e1b07', name: 'Civil Engineering' },
  ];

  useEffect(() => {
    supabase
      .from('departments')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDepartments(data);
        } else {
          setDepartments(FALLBACK_DEPARTMENTS);
        }
      })
      .catch(() => {
        setDepartments(FALLBACK_DEPARTMENTS);
      });
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await signUp(form.email, form.password, {
        full_name: form.fullName,
        register_number: form.registerNumber,
        department_id: form.departmentId || null,
        role: form.role,
      });

      setSuccess('Account created! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gradient-dark text-white' : 'bg-gradient-light text-dark-900'}`}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-xl glass hover:scale-110 transition-all duration-300 z-50"
      >
        {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-primary-500" />}
      </button>

      <div className={`w-full max-w-lg ${darkMode ? 'glass' : 'glass-light'} p-8 animate-scale-in relative z-10`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mb-4 animate-float">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm text-dark-400 mt-1">Join the CGPA Calculator</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-fade-in">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              name="fullName"
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              className="input-glass pl-12"
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              className="input-glass pl-12"
              required
            />
          </div>

          {/* Student-specific fields */}
          {form.role === 'student' && (
            <>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  name="registerNumber"
                  type="text"
                  placeholder="Register Number"
                  value={form.registerNumber}
                  onChange={handleChange}
                  className="input-glass pl-12"
                  required
                />
              </div>

              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  className="input-glass pl-12 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="input-glass pl-12"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                name="confirmPassword"
                type={showPass ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input-glass pl-12"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-pass"
              checked={showPass}
              onChange={() => setShowPass(!showPass)}
              className="accent-primary-500"
            />
            <label htmlFor="show-pass" className="text-sm text-dark-400 cursor-pointer">Show password</label>
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
                Create Account <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-dark-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
