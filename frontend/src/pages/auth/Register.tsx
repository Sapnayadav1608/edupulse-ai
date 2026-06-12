import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Eye, EyeOff, ArrowRight, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const roles = [
  { value: 'student', label: 'Student', emoji: '🎓' },
  { value: 'faculty', label: 'Faculty', emoji: '👨🏫' },
  { value: 'admin',   label: 'Admin',   emoji: '🛡️' },
];

const glassInput = "w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all backdrop-blur-sm";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,     setForm]     = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a8a 100%)' }}>

      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-30" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-25" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3 shadow-2xl">
            <GraduationCap size={28} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">EduPulse AI</h1>
          <p className="text-white/50 text-sm mt-0.5">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Join EduPulse 🚀</h2>
            <p className="text-white/50 text-sm mt-0.5">Fill in the details below</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Full Name</label>
              <input type="text" className={glassInput} placeholder="Your full name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Email address</label>
              <input type="email" className={glassInput} placeholder="you@college.edu"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className={`${glassInput} pr-11`}
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role picker */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all
                      ${form.role === r.value
                        ? 'bg-white/20 border-white/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}`}>
                    <span className="text-xl">{r.emoji}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 mt-1 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 active:scale-[.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <><UserCheck size={16} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/30 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-white/70 hover:text-white font-medium transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-5">
          © {new Date().getFullYear()} EduPulse AI. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
