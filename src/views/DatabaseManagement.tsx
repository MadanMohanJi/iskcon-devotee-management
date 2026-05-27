import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Devotee } from '../types';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  Search, 
  Download, 
  Trash2, 
  ArrowUpDown, 
  Users, 
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function DatabaseManagement() {
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'attendanceCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { isOwner } = useAuth();

  useEffect(() => {
    // Sync devotee database collections sorted by chosen fields
    const q = query(collection(db, 'devotees'), orderBy(sortBy, sortOrder));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDevotees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Devotee)));
    });
    return unsubscribe;
  }, [sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to remove this devotee from the global database tracking pools?')) return;
    try {
      await deleteDoc(doc(db, 'devotees', id));
    } catch (error) {
      console.error("Database deletion operation failed:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Contact Parameters', 'Mentor Reference', 'Daily Chanting', 'Attendance Count'];
    const rows = devotees.map(d => [
      `"${d.name.replace(/"/g, '""')}"`, 
      `"${d.contact}"`, 
      `"${d.mentor || 'Direct'}"`, 
      `"${d.chanting || 0}"`, 
      d.attendanceCount || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devotee_registry_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleSort = (field: 'name' | 'attendanceCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredDevotees = devotees.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.contact.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="space-y-6 text-left body-base p-1">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl text-primary-dark font-serif font-bold">Devotee Database</h1>
            <p className="text-stone-500 text-sm">Centralized historical matrix of all validated temple visitors.</p>
          </div>
          <button 
            type="button"
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2 self-start sm:self-auto py-2.5 px-4 bg-white border border-stone-200 rounded-xl text-stone-700 text-sm font-bold shadow-sm"
          >
            <Download size={16} className="text-primary" /> 
            <span>Export CSV</span>
          </button>
        </div>

        {/* Dynamic Metric Display Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">Total Registered Profiles</p>
              <p className="text-2xl font-serif font-bold text-stone-800">{devotees.length}</p>
            </div>
          </div>
        </div>

        {/* Database Search Filter Toolbar */}
        <div className="iskcon-glass p-6 space-y-4 bg-white">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input 
                type="text" 
                placeholder="Search global indexes by name or phone..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-primary bg-stone-50/20 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
              <button 
                type="button"
                onClick={() => toggleSort('name')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all focus:outline-none", sortBy === 'name' ? "bg-primary/10 text-primary-dark" : "text-stone-400 hover:bg-stone-50")}
              >
                <span>Sort Name</span> 
                <ArrowUpDown size={14} />
              </button>
              <button 
                type="button"
                onClick={() => toggleSort('attendanceCount')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all focus:outline-none", sortBy === 'attendanceCount' ? "bg-primary/10 text-primary-dark" : "text-stone-400 hover:bg-stone-50")}
              >
                <span>Sort Attendance</span> 
                <ArrowUpDown size={14} />
              </button>
              <button type="button" aria-label="Filters" className="p-2 text-stone-400 hover:text-stone-600 focus:outline-none"><Filter size={18} /></button>
            </div>
          </div>

          {/* Centralized Table Database Presentation Grid */}
          <div className="overflow-x-auto rounded-xl border border-stone-100">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50/80 border-b border-stone-200">
                <tr className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                  <th className="p-4">Devotee Profile</th>
                  <th className="p-4">Contact Parameters</th>
                  <th className="p-4">Mentor Guide</th>
                  <th className="p-4">Attendance Frequency</th>
                  {isOwner && <th className="p-4 text-center">Data Purge</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white text-sm">
                {filteredDevotees.map(d => (
                  <tr key={d.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 bg-stone-100 rounded-full border border-stone-200/50 flex items-center justify-center font-black text-stone-400 uppercase text-xs shrink-0 shadow-xs">
                          {d.name[0]}
                        </div>
                        <span className="font-bold text-stone-700 truncate">{d.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-stone-500 font-mono text-xs tracking-wide">{d.contact}</td>
                    <td className="p-4">
                      <span className="text-xs italic text-stone-400 font-serif">{d.mentor || 'Direct'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 max-w-[120px]">
                        <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/30">
                          <div 
                            className="bg-primary h-full transition-all duration-500" 
                            style={{ width: `${Math.min((d.attendanceCount || 0) * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-stone-600 shrink-0">{d.attendanceCount || 0}</span>
                      </div>
                    </td>
                    {isOwner && (
                      <td className="p-4 text-center">
                        <button 
                          type="button"
                          onClick={() => handleDelete(d.id!)}
                          className="text-stone-300 hover:text-red-500 transition-colors p-1 focus:outline-none"
                          aria-label={`Delete record for ${d.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredDevotees.length === 0 && (
            <div className="py-12 text-center text-stone-400 font-serif italic">
              No index records matching query criteria.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}