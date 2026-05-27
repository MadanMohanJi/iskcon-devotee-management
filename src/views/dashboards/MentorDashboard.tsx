import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Devotee, UserProfile } from '../../types';
import { Users, Phone, FileText, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function MentorDashboard() {
  const [activeTab, setActiveTab] = useState<'facilitation' | 'users' | 'reports'>('facilitation');
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [appUsers, setAppUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubD = onSnapshot(query(collection(db, 'devotees')), (snapshot) => {
      setDevotees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Devotee)));
    });

    const unsubU = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setAppUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });

    return () => {
      unsubD();
      unsubU();
    };
  }, []);

  const filteredDevotees = devotees.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.facilitatorName && d.facilitatorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left p-1">
      <div>
        <h2 className="text-3xl font-serif text-primary-dark font-bold">Mentor Insights</h2>
        <p className="text-stone-500 text-sm">Oversee assembly lines, metrics logs, and field coordinates.</p>
      </div>

      <div className="flex flex-wrap gap-2 pb-2 border-b border-stone-100">
        {[
          { id: 'facilitation', label: 'Global Devotee Index', icon: Users },
          { id: 'users', label: 'Personnel Mapping', icon: Phone },
          { id: 'reports', label: 'Calling Diagnostics', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
              activeTab === tab.id 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="iskcon-glass p-6 min-h-[400px]">
        {activeTab === 'facilitation' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input 
                type="text" 
                placeholder="Search index target profiles..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary outline-none text-sm bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-stone-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-400 text-[10px] font-black uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3.5 px-4">Devotee Name</th>
                    <th className="py-3.5 px-4">Contact Parameters</th>
                    <th className="py-3.5 px-4">Assigned Facilitator</th>
                    <th className="py-3.5 px-4">Mentor Guide</th>
                    <th className="py-3.5 px-4 text-center">Chanting Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white text-sm">
                  {filteredDevotees.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-800">{d.name}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-500">{d.contact}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-primary/10 text-primary-dark text-xs font-semibold px-2.5 py-0.5 rounded-lg">
                          {d.facilitatorName || 'System Root'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 italic">{d.mentor || 'Direct'}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-400">
                        {d.chanting || 0} rounds
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appUsers.map((user) => (
              <div key={user.uid} className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-lg uppercase shadow-inner">
                  {user.displayName?.[0] || '?'}
                </div>
                <div className="truncate flex-1">
                  <h4 className="font-bold text-stone-800 text-base leading-snug">{user.displayName}</h4>
                  <p className="text-xs text-stone-400 truncate">{user.email}</p>
                  <p className="text-xs font-bold text-primary-dark mt-1.5 flex items-center gap-1 font-mono">
                    <Phone size={12} className="text-primary" /> {user.contact || 'No telephone entry'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="flex flex-col items-center justify-center py-24 text-stone-400">
            <FileText size={56} className="text-primary opacity-20 mb-3 animate-pulse" />
            <p className="text-lg font-serif font-semibold text-stone-700">Analytical Logs Standby</p>
            <p className="text-xs text-stone-400 mt-1">Cross-session metrics materialize instantly upon active canvas deployment updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}