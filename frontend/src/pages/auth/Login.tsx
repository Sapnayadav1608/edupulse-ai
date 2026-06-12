import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Eye, EyeOff, ArrowRight, Brain, BarChart2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,     setForm]     = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a8a 100%)' }}>

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-25"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-20"
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4 shadow-2xl"
          >
            <GraduationCap size={32} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EduPulse AI</h1>
          <p className="text-white/50 text-sm mt-1">Intelligent Academic Platform</p>

          {/* Feature pills */}
          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
            {[
              { icon: Brain,    label: 'AI Powered' },
              { icon: BarChart2,label: 'Analytics' },
              { icon: Shield,   label: 'Secure' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs backdrop-blur-sm">
                <Icon size={11} /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Welcome back 👋</h2>
            <p className="text-white/50 text-sm mt-0.5">Sign in to your account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2 backdrop-blur-sm"
            >
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all backdrop-blur-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-white/80">Password</label>
                <Link to="/forgot-password" className="text-xs text-white/50 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 active:scale-[.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-6">
            Contact your administrator to get access.
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} EduPulse AI. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
