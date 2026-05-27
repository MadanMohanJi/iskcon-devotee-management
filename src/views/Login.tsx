import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, loginWithUserId } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, User, Shield, Crown, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type LoginMode = 'user' | 'mentor' | 'owner';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('user');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-cream font-serif text-primary">
         <div className="text-4xl font-bold animate-pulse">Radhe Radhe...</div>
         <p className="mt-4 text-stone-400 text-sm">Loading your profile</p>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google authentication encountered an error.');
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
      setError('Invalid User ID or Password setup configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'user', label: 'User', icon: User },
    { id: 'mentor', label: 'Mentor', icon: Shield },
    { id: 'owner', label: 'Owner', icon: Crown },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4 body-base">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[450px] bg-white rounded-[32px] p-8 md:p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-8"
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-stone-800 font-serif">KrishnaSeva</h1>
          <p className="text-xs text-primary font-black uppercase tracking-[0.25em]">Devotee Management</p>
        </div>

        {/* Level Control Tabs */}
        <div className="flex w-full bg-stone-100 p-1 rounded-2xl border border-stone-200/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id as LoginMode);
                setError('');
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden focus:outline-none",
                mode === tab.id ? "bg-white shadow-sm text-stone-800" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <tab.icon size={16} />
              <span className="text-[10px] uppercase font-black tracking-wider">{tab.label}</span>
              {mode === tab.id && (
                <motion.div 
                  layoutId="tab-underline" 
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Form Modules Area */}
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
                <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 text-left space-y-2">
                   <h3 className="text-amber-800 font-bold flex items-center gap-2 text-sm">
                     <Crown size={16} /> Owner Access Required
                   </h3>
                   <p className="text-xs text-amber-700 leading-relaxed">
                     Only verified platform owners can authenticate using Google single sign-on. If you are a Mentor or general Sevak User, select the alternative tabs.
                   </p>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3.5 gap-3 bg-stone-800 border-none shadow-md hover:bg-stone-900 cursor-pointer"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4 rounded-full" alt="google" />
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
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-2 tracking-widest">Username / User ID</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. sevak123"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium"
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-2 tracking-widest">Security Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-primary outline-none transition-all text-sm font-medium"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 border border-red-200"
                    >
                      <AlertCircle size={14} className="shrink-0" /> 
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit"
                  disabled={isSubmitting || !userId || !password}
                  className="w-full btn-primary py-3.5 gap-2 cursor-pointer uppercase tracking-wider text-xs shadow-lg"
                >
                  {isSubmitting ? 'Authenticating...' : `Sign in as ${mode}`}
                  <ChevronRight size={16} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-[10px] text-stone-400 font-medium leading-relaxed italic font-serif">
          Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare<br/>
          Hare Rama, Hare Rama, Rama Rama, Hare Hare
        </p>
      </motion.div>
    </div>
  );
}