import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// Views
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import EventDetail from './views/EventDetail';
import DatabaseManagement from './views/DatabaseManagement';
import AttendanceSheet from './views/AttendanceSheet';
import History from './views/History';
import DevoteeProfile from './views/DevoteeProfile';
import PublicAttendance from './views/PublicAttendance';

// Protected Route Component to restrict access based on User Roles
const ProtectedRoute: React.FC<{ children: React.ReactNode; minRole?: 'USER' | 'MENTOR' | 'OWNER' }> = ({ children, minRole = 'USER' }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-cream">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-8" />
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] font-black text-stone-800 uppercase tracking-[0.4em] animate-pulse">Syncing Soul</p>
          <p className="text-xs font-medium text-stone-400 italic font-serif">Verifying presence at the temple...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (minRole === 'OWNER' && profile?.role !== 'OWNER') {
    return <Navigate to="/" replace />;
  }
  
  if (minRole === 'MENTOR' && profile?.role === 'USER') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* User Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute minRole="USER">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute minRole="USER">
              <EventDetail />
            </ProtectedRoute>
          } />
          
          {/* Owner/Admin Protected Routes */}
          <Route path="/database" element={
            <ProtectedRoute minRole="OWNER">
              <DatabaseManagement />
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute minRole="OWNER">
              <AttendanceSheet />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute minRole="OWNER">
              <History />
            </ProtectedRoute>
          } />
          
          {/* Public Access/Profile Routes */}
          <Route path="/profile/:id" element={<DevoteeProfile />} />
          <Route path="/public-attendance/:id" element={<PublicAttendance />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}