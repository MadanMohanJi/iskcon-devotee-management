import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, loginWithUserId } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User, Shield, Crown, Lock, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

type LoginMode = 'user' | 'mentor' | 'owner';

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('user');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 font-sans text-primary">
       <div className="text-4xl font-bold animate-pulse">Radhe Radhe...</div>
       <p className="mt-4 text-slate-400">Loading your profile</p>
    </div>
  );
  if (user) return <Navigate to="/" />;

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithUserId(userId, password);
      navigate('/');
    } catch (err: any) {
      setError('Invalid User ID or Password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'user', label: 'User', icon: User, color: 'text-emerald-600' },
    { id: 'mentor', label: 'Mentor', icon: Shield, color: 'text-blue-600' },
    { id: 'owner', label: 'Owner', icon: Crown, color: 'text-amber-600' },
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-slate-50"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url('${import.meta.env.BASE_URL}background.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[450px] bg-white rounded-[32px] p-10 card-shadow border border-slate-100 flex flex-col items-center text-center space-y-8"
      >
        <div className="space-y-1 flex flex-col items-center">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="ISKCON Logo" className="h-16 mb-2" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">KrishnaSeva</h1>
          <p className="text-xs text-primary uppercase tracking-widest font-bold">Devotee Management</p>
        </div>

        {/* Level Tabs */}
        <div className="flex w-full bg-slate-50 p-1 rounded-2xl border border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id as LoginMode);
                setError('');
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                mode === tab.id ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon size={16} />
              <span className="text-[10px] uppercase font-bold tracking-wider">{tab.label}</span>
              {mode === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-primary" />}
            </button>
          ))}
        </div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            {mode === 'owner' ? (
              <motion.div 
                key="owner-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-left space-y-2">
                   <h3 className="text-amber-800 font-bold flex items-center gap-2">
                     <Crown size={18} /> Owner Access
                   </h3>
                   <p className="text-xs text-amber-700 leading-relaxed">
                     Welcome to the Owner Portal. Log in using your Google account to manage your specific temple data.
                   </p>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 gap-3 bg-slate-900 border-none shadow-xl shadow-slate-100"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5 rounded-full" alt="google" />
                  Sign in as Owner
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="id-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleIdLogin}
                className="space-y-4"
              >
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Username / ID</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. sevak123"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 ring-primary/5 outline-none transition-all text-sm font-medium"
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 ring-primary/5 outline-none transition-all text-sm font-medium"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-red-50 text-red-600 text-xs py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 gap-3"
                >
                  Sign in as {mode === 'user' ? 'User' : 'Mentor'}
                  <ChevronRight size={18} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[10px] text-slate-400 font-medium">
          Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare<br/>
          Hare Rama, Hare Rama, Rama Rama, Hare Hare
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
