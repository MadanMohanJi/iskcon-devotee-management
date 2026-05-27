import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isMentor: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Fetch user profile from the database
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            let roleToSet: UserRole = data.role;
            let templeIdToSet = data.templeId;
            let needsUpdate = false;
            
            // Auto-promote the main administrator email if their base role is outdated
            if (firebaseUser.email === 'prabhasoni101@gmail.com' && roleToSet !== 'OWNER') {
              roleToSet = 'OWNER';
              needsUpdate = true;
            }

            // Ensure Owners have a valid temple collection reference mapping
            if (roleToSet === 'OWNER' && !templeIdToSet) {
              templeIdToSet = firebaseUser.uid;
              needsUpdate = true;
            }

            if (needsUpdate) {
               await setDoc(profileRef, { role: roleToSet, templeId: templeIdToSet }, { merge: true });
            }
            
            setProfile({ 
              uid: firebaseUser.uid, 
              displayName: data.displayName || firebaseUser.displayName || 'Sevak',
              email: firebaseUser.email || '',
              role: roleToSet,
              templeId: templeIdToSet,
              contact: data.contact || ''
            } as UserProfile);
          } else {
            // Default authorization fallback for new direct administrator registrations
            const role: UserRole = 'OWNER';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Owner',
              email: firebaseUser.email || '',
              role,
              templeId: firebaseUser.uid,
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Authentication synchronization error:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signOut = () => auth.signOut();

  // Role authorization flag calculation
  const isOwner = profile?.role === 'OWNER';
  const isMentor = profile?.role === 'MENTOR' || isOwner;
  const isAdmin = isMentor; // Admin groups both Mentors and Owners implicitly

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      isMentor, 
      isOwner, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used strictly within an explicit AuthProvider wrapper.');
  }
  return context;
};