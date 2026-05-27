import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { EventModel, UserProfile, UserRole } from '../../types';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, Eye, EyeOff, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerSevak } from '../../services/firebase';
import { cn } from '../../lib/utils';

export default function OwnerDashboard() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'personnel'>('events');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<UserRole>('USER');
  const [regForm, setRegForm] = useState({ name: '', contact: '' });
  const [generatedCreds, setGeneratedCreds] = useState<{ id: string, pass: string } | null>(null);
  
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', mediaUrl: '' });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    const qE = query(collection(db, 'events'), orderBy('date', 'desc'));
    const unsubE = onSnapshot(qE, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventModel));
      setEvents(allEvents.filter(e => e.createdBy === profile?.uid));
    });

    const qU = query(collection(db, 'users'));
    const unsubU = onSnapshot(qU, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(allUsers.filter(u => u.templeId === profile?.uid));
    });

    return () => {
      unsubE();
      unsubU();
    };
  }, [profile?.uid]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  const handleRegisterSevak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.contact) return;
    
    setIsRegistering(true);
    try {
      const uniqueId = `${regForm.name.toLowerCase().replace(/\s/g, '')}${Math.floor(100 + Math.random() * 900)}`;
      const password = Math.random().toString(36).slice(-8);

      const userCred = await registerSevak(uniqueId, password);
      
      await setDoc(doc(db, 'users', userCred.user.uid), {
        displayName: regForm.name.trim(),
        contact: regForm.contact.trim(),
        role: registrationMode,
        email: userCred.user.email,
        username: uniqueId,
        password: password,
        templeId: profile?.uid,
        createdAt: new Date().toISOString()
      });

      setGeneratedCreds({ id: uniqueId, pass: password });
      setRegForm({ name: '', contact: '' });
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select a smaller photo.");
        return;
      }
      const base64 = await resizeImage(file);
      setNewEvent({...newEvent, mediaUrl: base64});
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        status: 'UPCOMING',
        createdBy: profile?.uid,
        createdAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      setNewEvent({ title: '', date: '', description: '', mediaUrl: '' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl text-primary-dark font-serif font-bold underline decoration-gold underline-offset-4 decoration-2">Owner Control Panel</h2>
          <p className="text-stone-500 mt-1">Manage events, assignments, and temple growth.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveTab('events')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'events' ? "bg-primary text-white shadow" : "text-stone-500 hover:bg-stone-50")}
          >
            Manage Events
          </button>
          <button 
            onClick={() => setActiveTab('personnel')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'personnel' ? "bg-primary text-white shadow" : "text-stone-500 hover:bg-stone-50")}
          >
            Personnel List
          </button>
        </div>
      </div>

      {activeTab === 'events' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus size={18} /> New Event
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="iskcon-glass overflow-hidden flex flex-col group cursor-pointer hover:border-primary/50 transition-all bg-white"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {event.mediaUrl ? (
                  <img src={event.mediaUrl} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-48 bg-stone-100 flex items-center justify-center text-stone-300">
                    <Calendar size={48} />
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-stone-800 line-clamp-1">{event.title}</h3>
                    {event.status === 'UPCOMING' ? (
                      <span className="bg-green-100 text-green-700 text-[10px] uppercase font-black px-2 py-1 rounded-full flex items-center gap-1">
                        <Eye size={10} /> Live
                      </span>
                    ) : (
                      <span className="bg-stone-100 text-stone-500 text-[10px] uppercase font-black px-2 py-1 rounded-full flex items-center gap-1">
                        <EyeOff size={10} /> Completed
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-stone-600">
                    <p className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> {event.date}</p>
                    <p className="line-clamp-2 italic font-serif opacity-80">{event.description || 'No description provided.'}</p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 flex justify-between items-center text-xs font-bold text-stone-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Users size={14} /> View Details</span>
                    <span className="text-primary-dark">Click to Manage</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl w-full p-0 flex flex-col md:flex-row overflow-hidden shadow-sm border border-slate-200 min-h-[600px]"
        >
          {/* Left Panel: Authorized Personnel List */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
               <h2 className="text-2xl font-serif font-bold text-stone-800">Authorized Personnel</h2>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-stone-800 text-lg">{u.displayName}</p>
                    <p className="text-xs text-stone-500 mb-3">{u.email}</p>
                    <div className="flex gap-1.5">
                      {(['USER', 'MENTOR', 'OWNER'] as UserRole[]).map(role => (
                        <button 
                          key={role}
                          onClick={() => handleUpdateRole(u.uid, role)}
                          className={cn(
                            "px-3 py-1 rounded-md text-[10px] font-black transition-all uppercase tracking-widest",
                            u.role === role ? "bg-stone-800 text-white shadow-sm" : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 min-w-[200px] text-left">
                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Generated Credentials</p>
                     <p className="text-xs font-mono font-medium text-stone-700 break-all select-all">
                       ID: {(u as any).username || 'N/A'} 
                     </p>
                     <p className="text-xs font-mono font-medium text-stone-700 break-all select-all mt-0.5">
                       Pass: {(u as any).password || '••••'}
                     </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Creation Form */}
          <div className="w-full md:w-96 bg-slate-50 p-8 border-l border-slate-200 space-y-6">
            <h3 className="text-xl font-serif font-bold text-stone-800">Add Staff Account</h3>

            {generatedCreds ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-2xl border-2 border-primary/20 border-dashed text-center space-y-4 shadow-sm"
              >
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield size={24} />
                </div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Access Key Generated</p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-left border border-slate-200">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">User ID</p>
                    <p className="font-mono text-base font-bold select-all text-stone-800">{generatedCreds.id}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Temporary Password</p>
                    <p className="font-mono text-base font-bold select-all text-stone-800">{generatedCreds.pass}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setGeneratedCreds(null)}
                  className="w-full btn-secondary text-xs py-2.5 font-bold uppercase tracking-wider"
                >
                  Register Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleRegisterSevak} className="space-y-5">
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button 
                    type="button"
                    onClick={() => setRegistrationMode('USER')}
                    className={cn("flex-1 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest", registrationMode === 'USER' ? "bg-primary text-white shadow" : "text-slate-400")}
                  >
                    User
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRegistrationMode('MENTOR')}
                    className={cn("flex-1 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest", registrationMode === 'MENTOR' ? "bg-primary text-white shadow" : "text-slate-400")}
                  >
                    Mentor
                  </button>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Amit Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-primary outline-none text-sm font-medium transition-all"
                    value={regForm.name}
                    onChange={e => setRegForm({...regForm, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact String</label>
                  <input 
                    type="tel" required
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-primary outline-none text-sm font-medium transition-all"
                    value={regForm.contact}
                    onChange={e => setRegForm({...regForm, contact: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isRegistering}
                  className="w-full btn-primary py-3 text-xs uppercase tracking-wider font-bold shadow-md mt-2"
                >
                  {isRegistering ? 'Generating Profile...' : `Register ${registrationMode}`}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      )}

      {/* Dynamic Creation Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <h2 className="text-2xl font-serif font-bold text-stone-800">Create New Event</h2>
              <button className="text-stone-400 hover:text-primary font-bold text-xl" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Event Title</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none text-sm transition-all"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="e.g. Sri Krishna Janmashtami"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Date</label>
                <input 
                  type="date" required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none text-sm transition-all"
                  value={newEvent.date}
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Description</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none text-sm transition-all"
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Festival timing details..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Cover Poster Image</label>
                <input 
                  type="file"
                  accept="image/*"
                  className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-primary hover:file:bg-orange-100"
                  onChange={handleImageChange}
                />
                {newEvent.mediaUrl && <img src={newEvent.mediaUrl} alt="Preview" className="h-16 w-24 object-cover rounded shadow-sm mt-2" />}
              </div>
              <button type="submit" className="w-full btn-primary py-3.5 text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                Publish Blissful Celebration
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}