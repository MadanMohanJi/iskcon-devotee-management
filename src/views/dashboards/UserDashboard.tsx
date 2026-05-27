import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { EventModel, Devotee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Calendar, UserPlus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'events' | 'facilitation'>('events');
  const [events, setEvents] = useState<EventModel[]>([]);
  const [newDevotee, setNewDevotee] = useState({ name: '', contact: '', mentor: '', chanting: '' });
  const [recentAdditions, setRecentAdditions] = useState<Devotee[]>([]);
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only monitor active public temple event tracks
    const qE = query(collection(db, 'events'), where('isPublic', '==', true));
    const unsubscribeE = onSnapshot(qE, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventModel)));
    });

    let unsubscribeD = () => {};
    if (profile?.uid) {
      const qD = query(collection(db, 'devotees'), where('facilitatorId', '==', profile.uid));
      unsubscribeD = onSnapshot(qD, (snapshot) => {
        setRecentAdditions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Devotee)));
      });
    }

    return () => {
      unsubscribeE();
      unsubscribeD();
    };
  }, [profile]);

  const handleAddDevotee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevotee.name || !newDevotee.contact) return;
    try {
      await addDoc(collection(db, 'devotees'), {
        name: newDevotee.name.trim(),
        contact: newDevotee.contact.trim(),
        mentor: newDevotee.mentor.trim() || 'Direct',
        chanting: newDevotee.chanting || '0',
        facilitatorId: profile?.uid,
        facilitatorName: profile?.displayName || 'Anonymous Sevak',
        attendanceCount: 0,
        templeId: profile?.templeId || '',
        createdAt: new Date().toISOString()
      });
      setNewDevotee({ name: '', contact: '', mentor: '', chanting: '' });
      alert('Devotee record successfully submitted!');
    } catch (error) {
      console.error(error);
      alert('Submission error. Please verify entry variables.');
    }
  };

  return (
    <div className="space-y-8 body-base p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-primary-dark font-bold">Sevak Dashboard</h2>
          <p className="text-stone-500 italic font-serif">"Selfless service is the highest worship."</p>
        </div>
        <div className="flex bg-white/50 border border-stone-200 p-1 rounded-2xl shadow-sm">
          <button 
            type="button"
            onClick={() => setActiveTab('events')}
            className={cn("px-6 py-2 rounded-xl transition-all font-bold text-sm", activeTab === 'events' ? "bg-primary text-white shadow" : "text-stone-600")}
          >
            Active Events
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('facilitation')}
            className={cn("px-6 py-2 rounded-xl transition-all font-bold text-sm", activeTab === 'facilitation' ? "bg-primary text-white shadow" : "text-stone-600")}
          >
            Facilitation Registry
          </button>
        </div>
      </div>

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full py-20 text-center text-stone-400 font-serif iskcon-glass">
              <Calendar size={48} className="mx-auto opacity-30 mb-4 text-primary" />
              <p>No active celebrations found. Waiting for system synchronization...</p>
            </div>
          ) : (
            events.map((event) => (
              <motion.div 
                key={event.id}
                whileHover={{ y: -4 }}
                className="iskcon-glass p-6 space-y-4 hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                      <Calendar size={22} />
                    </div>
                    <ChevronRight size={18} className="text-stone-300" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 line-clamp-1">{event.title}</h3>
                  <p className="text-xs text-stone-400 mt-1">{event.date}</p>
                </div>
                
                <div className="bg-primary/5 rounded-xl p-4 text-xs text-stone-600 mt-2">
                  <p className="line-clamp-2 italic leading-relaxed">
                    {event.description || 'Join us for this blissful celebration at the temple.'}
                  </p>
                </div>
                
                <div className="pt-4 flex items-center justify-between text-xs font-bold text-primary uppercase tracking-wider">
                  <span>My Assignment List</span>
                  <span>Open Seva &rarr;</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'facilitation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="iskcon-glass p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <UserPlus size={22} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-800">Add New Devotee Profile</h3>
              </div>
              
              <form onSubmit={handleAddDevotee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Full Name</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-primary outline-none transition-all text-sm"
                    value={newDevotee.name}
                    onChange={e => setNewDevotee({...newDevotee, name: e.target.value})}
                    placeholder="Enter absolute name"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Contact Number</label>
                  <input 
                    type="tel" required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-primary outline-none transition-all text-sm"
                    value={newDevotee.contact}
                    onChange={e => setNewDevotee({...newDevotee, contact: e.target.value})}
                    placeholder="Phone connection string"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Mentor Reference</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-primary outline-none transition-all text-sm"
                    value={newDevotee.mentor}
                    onChange={e => setNewDevotee({...newDevotee, mentor: e.target.value})}
                    placeholder="Siksha or Diksa Guide"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-stone-500 uppercase">Chanting (Daily Rounds)</label>
                  <input 
                    type="number" min="0" max="64"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-primary outline-none transition-all text-sm"
                    value={newDevotee.chanting}
                    onChange={e => setNewDevotee({...newDevotee, chanting: e.target.value})}
                    placeholder="Total active rounds"
                  />
                </div>
                <button type="submit" className="md:col-span-2 btn-primary w-full py-3.5 mt-2 text-sm font-bold tracking-wider uppercase">
                  Commit Devotee Record
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Activity Log */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] pl-2">Your Recent Submissions</h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {recentAdditions.map((d) => (
                <div key={d.id} className="bg-white border border-stone-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="text-left">
                    <p className="font-bold text-stone-800 text-sm">{d.name}</p>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">{d.contact}</p>
                  </div>
                  <div className="bg-green-100 text-green-600 p-1.5 rounded-full">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
              ))}
              {recentAdditions.length === 0 && (
                <p className="text-xs text-stone-400 italic text-center py-12 bg-white/50 border border-dashed border-stone-200 rounded-2xl">
                  No devotees logged during this browser session.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}