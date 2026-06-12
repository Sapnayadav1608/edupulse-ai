import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

type Step = 'email' | 'otp' | 'password' | 'done';
const STEPS = [{ key: 'email', label: 'Email' }, { key: 'otp', label: 'Verify' }, { key: 'password', label: 'Reset' }];

const glassInput = "w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all backdrop-blur-sm";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step,        setStep]        = useState<Step>('email');
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.post('/auth/forgot-password', { email }); setStep('otp'); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Enter 6-digit OTP');
    setError(''); setStep('password');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('Min. 6 characters');
    setError(''); setLoading(true);
    try { await api.post('/auth/reset-password', { email, otp, newPassword }); setStep('done'); }
    catch (err: any) { setError(err.response?.data?.message || 'Reset failed.'); setStep('otp'); }
    finally { setLoading(false); }
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
          <p className="text-white/50 text-sm mt-0.5">Password Recovery</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

          {step !== 'done' && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
              <p className="text-white/50 text-sm mt-0.5">Follow the steps below</p>

              {/* Step indicator */}
              <div className="flex items-center mt-5">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${i < stepIndex  ? 'bg-white text-primary-700' :
                          i === stepIndex ? 'bg-white text-primary-700 ring-4 ring-white/20' :
                                           'bg-white/10 text-white/40'}`}>
                        {i < stepIndex ? <CheckCircle size={14} /> : i + 1}
                      </div>
                      <span className={`text-xs font-medium ${i <= stepIndex ? 'text-white/80' : 'text-white/30'}`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 mx-1 rounded ${i < stepIndex ? 'bg-white/60' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input type="email" className={`${glassInput} pl-10`} placeholder="your@college.edu"
                      value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                  </div>
                  <p className="text-xs text-white/30 mt-1.5">We'll send a 6-digit OTP to this email</p>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg">
                  {loading ? 'Sending...' : <><span>Send OTP</span><ArrowRight size={15} /></>}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">6-digit OTP</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input type="text" className={`${glassInput} pl-10 text-center tracking-[0.4em] text-lg font-bold`}
                      placeholder="000000" maxLength={6}
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required autoFocus />
                  </div>
                  <p className="text-xs text-white/30 mt-1.5">Sent to <strong className="text-white/60">{email}</strong> — valid 10 mins</p>
                </div>
                <button type="submit"
                  className="w-full py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <span>Verify OTP</span><ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="w-full text-sm text-white/30 hover:text-white/60 transition-colors">← Change email</button>
              </motion.form>
            )}

            {step === 'password' && (
              <motion.form key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input type={showPass ? 'text' : 'password'} className={`${glassInput} pl-10 pr-11`}
                      placeholder="Min. 6 characters"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoFocus />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </motion.form>
            )}

            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2 space-y-4">
                <div className="w-16 h-16 bg-green-400/20 border border-green-400/30 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Password Reset!</h3>
                  <p className="text-sm text-white/50 mt-1">Your password has been updated successfully.</p>
                </div>
                <button onClick={() => navigate('/login')}
                  className="w-full py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-lg">
                  Go to Login <ArrowRight size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== 'done' && (
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors mt-6 mx-auto">
              <ArrowLeft size={13} /> Back to Login
            </button>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-5">
          © {new Date().getFullYear()} EduPulse AI. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
