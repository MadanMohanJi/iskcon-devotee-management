import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { 
  doc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { Event, CallingAssignment, UserProfile, Devotee } from '../types';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Eye, 
  EyeOff, 
  ChevronLeft,
  Search,
  Calendar,
  MinusCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isOwner, isMentor } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [assignments, setAssignments] = useState<CallingAssignment[]>([]);
  const [appUsers, setAppUsers] = useState<UserProfile[]>([]);
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  
  // Modal & Selection States
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDevotees, setSelectedDevotees] = useState<string[]>([]);
  const [searchDevotee, setSearchDevotee] = useState('');

  useEffect(() => {
    if (!id) return;

    // Stream targeted Event Details
    const unsubEvent = onSnapshot(doc(db, 'events', id), (docSnap) => {
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() } as Event);
      } else {
        navigate('/');
      }
    });

    // Stream Assignments based on role permissions
    let qA;
    if (isOwner || isMentor) {
      qA = query(collection(db, `events/${id}/assignments`));
    } else if (profile?.uid) {
      qA = query(collection(db, `events/${id}/assignments`), where('userId', '==', profile.uid));
    }

    let unsubAssignments = () => {};
    if (qA) {
      unsubAssignments = onSnapshot(qA, (snapshot) => {
        setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallingAssignment)));
      });
    }

    // Load directory subsets if the current user is an Owner
    if (isOwner) {
      // Fetch Sevak staff choices
      getDocs(query(collection(db, 'users'))).then(snap => {
        let usrs = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        usrs = usrs.filter(u => u.templeId === profile?.uid && u.role !== 'OWNER');
        setAppUsers(usrs);
      });

      // Fetch global devotee listings
      getDocs(query(collection(db, 'devotees'))).then(snap => {
        const devs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Devotee));
        setDevotees(devs);
      });
    }

    return () => {
      unsubEvent();
      unsubAssignments();
    };
  }, [id, isOwner, isMentor, profile, navigate]);

  const handleTogglePublic = async () => {
    if (!event) return;
    await updateDoc(doc(db, 'events', event.id!), { isPublic: !event.isPublic });
  };

  const handleUpdateAssignment = async (assignmentId: string, response: CallingAssignment['response']) => {
    if (!id) return;
    await updateDoc(doc(db, `events/${id}/assignments/${assignmentId}`), {
      response,
      status: 'COMPLETED',
      updatedAt: new Date().toISOString()
    });
  };

  const handleBulkAssign = async () => {
    if (!selectedUserId || selectedDevotees.length === 0 || !id) return;
    
    const batch = writeBatch(db);
    selectedDevotees.forEach(devId => {
      const devotee = devotees.find(d => d.id === devId);
      if (!devotee) return;
      
      const assignRef = doc(collection(db, `events/${id}/assignments`));
      batch.set(assignRef, {
        eventId: id,
        devoteeId: devId,
        userId: selectedUserId,
        devoteeName: devotee.name,
        devoteeContact: devotee.contact,
        status: 'PENDING',
        response: 'NONE',
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();
    setIsAssigning(false);
    setSelectedDevotees([]);
    setSelectedUserId(null);
  };

  if (!event) return null;

  return (
    <Layout>
      <div className="space-y-6 text-left body-base p-1">
        {/* Upper Action Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="text-stone-400 hover:text-primary flex items-center gap-1 text-sm font-bold tracking-wide focus:outline-none"
            >
              <ChevronLeft size={16} /> Back to Hub
            </button>
            <h1 className="text-4xl text-primary-dark font-serif font-bold">{event.title}</h1>
            <p className="text-stone-500 text-sm flex items-center gap-1.5 font-medium">
              <Calendar size={16} className="text-primary" />
              <span>{event.date}</span>
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button 
                type="button"
                onClick={handleTogglePublic}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none border border-transparent",
                  event.isPublic ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                )}
              >
                {event.isPublic ? <><Eye size={14} /> Public Live</> : <><EyeOff size={14} /> Internal Only</>}
              </button>
              <button 
                type="button"
                onClick={() => setIsAssigning(true)}
                className="btn-primary flex items-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                <UserPlus size={14} /> Assign Calling
              </button>
            </div>
          )}
        </div>

        {/* Standard Sevak View: Assigned Tasks List */}
        {!isOwner && !isMentor && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h2 className="text-xl font-serif font-bold text-stone-700">My Personal Calling List</h2>
              <span className="text-[10px] font-black tracking-wider text-stone-400 uppercase bg-stone-100 border border-stone-200 px-3 py-1 rounded-full">
                {assignments.length} assigned records
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="truncate">
                        <h3 className="text-lg font-bold text-stone-800 truncate">{assignment.devoteeName}</h3>
                        <a 
                          href={`tel:${assignment.devoteeContact}`}
                          className="text-primary font-bold flex items-center gap-1 text-xs mt-1.5 hover:underline font-mono"
                        >
                          <Phone size={12} /> {assignment.devoteeContact}
                        </a>
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 border",
                        assignment.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"
                      )}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-wider">
                    <button 
                      type="button"
                      onClick={() => handleUpdateAssignment(assignment.id!, 'COMING')}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all border focus:outline-none",
                        assignment.response === 'COMING' ? "bg-green-600 text-white border-green-600 shadow-sm" : "bg-stone-50 text-stone-600 border-stone-200 hover:border-green-300"
                      )}
                    >
                      <CheckCircle size={14} /> Coming
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleUpdateAssignment(assignment.id!, 'NOT_COMING')}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all border focus:outline-none",
                        assignment.response === 'NOT_COMING' ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-stone-50 text-stone-600 border-stone-200 hover:border-red-300"
                      )}
                    >
                      <XCircle size={14} /> Not
                    </button>
                  </div>
                </div>
              ))}
              
              {assignments.length === 0 && (
                <div className="col-span-full py-16 iskcon-glass text-center text-stone-400 italic">
                  No devotees have been assigned to your list for this track yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin/Owner View: Complete Call Status Board */}
        {(isOwner || isMentor) && (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-stone-700">Calling Operation Dashboard</h2>
            <div className="iskcon-glass overflow-hidden bg-white border border-stone-200">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                    <th className="p-4">Devotee Target</th>
                    <th className="p-4">Assigned Sevak Staff</th>
                    <th className="p-4">Process Status</th>
                    <th className="p-4">Response Confirmation</th>
                    {isOwner && <th className="p-4 text-center">Unassign</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white text-sm">
                  {assignments.map(ass => (
                    <tr key={ass.id} className="hover:bg-stone-50/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-stone-700">{ass.devoteeName}</p>
                        <p className="text-xs font-mono text-stone-400 mt-0.5">{ass.devoteeContact}</p>
                      </td>
                      <td className="p-4 font-semibold text-stone-600">
                        {appUsers.find(u => u.uid === ass.userId)?.displayName || 'System Managed'}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                          ass.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-200" : "bg-stone-100 text-stone-400 border-stone-200"
                        )}>
                          {ass.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                          ass.response === 'COMING' ? "bg-green-50 text-green-700 border-green-200" :
                          ass.response === 'NOT_COMING' ? "bg-red-50 text-red-700 border-red-200" : "bg-stone-50 text-stone-400 border-stone-200"
                        )}>
                          {ass.response}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="p-4 text-center">
                          <button 
                            type="button"
                            onClick={() => deleteDoc(doc(db, `events/${id}/assignments/${ass.id!}`))} 
                            className="text-stone-300 hover:text-red-500 transition-colors focus:outline-none p-1"
                            aria-label="Remove assignment"
                          >
                            <MinusCircle size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {assignments.length === 0 && (
                <div className="py-12 text-center text-stone-400 font-serif italic">
                  No active assignments have been published for this event container yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Assign Call Task Allocation Modal Overlay */}
      <AnimatePresence>
        {isAssigning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/60">
                <h2 className="text-2xl font-serif font-bold text-stone-800">Assign Event Calling Matrix</h2>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAssigning(false);
                    setSelectedDevotees([]);
                    setSelectedUserId(null);
                  }}
                  className="text-stone-400 hover:text-primary p-2 text-xl font-bold focus:outline-none"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left Side Panel: Sevak Selector Column */}
                <div className="w-full md:w-1/3 border-r border-stone-200 p-6 space-y-4 overflow-y-auto bg-stone-50/30">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">1. Select Target Sevak</h3>
                  <div className="space-y-2">
                    {appUsers.map(user => (
                      <button
                        key={user.uid}
                        type="button"
                        onClick={() => setSelectedUserId(user.uid)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left focus:outline-none border",
                          selectedUserId === user.uid 
                            ? "bg-primary text-white border-primary shadow-sm" 
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase tracking-wide", selectedUserId === user.uid ? "bg-white/20" : "bg-stone-100 border border-stone-200")}>
                          {user.displayName?.[0].toUpperCase()}
                        </div>
                        <div className="truncate flex-1">
                          <p className="font-bold text-sm leading-tight truncate">{user.displayName}</p>
                          <p className="text-[9px] font-black tracking-wide uppercase mt-0.5 opacity-70">{user.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Side Panel: Devotee Checklist Matrix Column */}
                <div className="flex-1 p-6 space-y-4 flex flex-col overflow-hidden bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      2. Select Target Devotees ({selectedDevotees.length})
                    </h3>
                    <div className="relative w-full sm:w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="text" 
                        placeholder="Filter profiles..." 
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 outline-none bg-stone-50 focus:bg-white"
                        value={searchDevotee}
                        onChange={e => setSearchDevotee(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-stone-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-stone-50 sticky top-0 border-b border-stone-200 font-bold uppercase tracking-wider text-stone-400 text-[10px]">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input 
                              type="checkbox" 
                              aria-label="Select all"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDevotees(devotees.map(d => d.id!));
                                } else {
                                  setSelectedDevotees([]);
                                }
                              }}
                            />
                          </th>
                          <th className="p-3">Devotee Name</th>
                          <th className="p-3">Contact Params</th>
                          <th className="p-3">Mentor Guide</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                        {devotees.filter(d => d.name.toLowerCase().includes(searchDevotee.toLowerCase())).map(d => (
                          <tr key={d.id} className={cn(selectedDevotees.includes(d.id!) && "bg-primary/5")}>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedDevotees.includes(d.id!)}
                                onChange={() => {
                                  setSelectedDevotees(prev => 
                                    prev.includes(d.id!) ? prev.filter(i => i !== d.id) : [...prev, d.id!]
                                  );
                                }}
                              />
                            </td>
                            <td className="p-3 font-bold text-stone-800">{d.name}</td>
                            <td className="p-3 text-stone-500 font-mono text-xs">{d.contact}</td>
                            <td className="p-3 text-stone-400 italic font-serif">{d.mentor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2 text-xs font-bold uppercase tracking-wider">
                 <button 
                  type="button"
                  onClick={() => {
                    setIsAssigning(false);
                    setSelectedDevotees([]);
                    setSelectedUserId(null);
                  }}
                  className="btn-secondary py-2.5 px-4"
                 >
                  Cancel
                 </button>
                 <button 
                  type="button"
                  disabled={!selectedUserId || selectedDevotees.length === 0}
                  onClick={handleBulkAssign}
                  className="btn-primary py-2.5 px-4 shadow-sm"
                 >
                  Confirm Allocation ({selectedDevotees.length})
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}