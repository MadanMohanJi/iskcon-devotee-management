export type UserRole = 'USER' | 'MENTOR' | 'OWNER';

export interface DevoteeProfile {
  id: string;
  uid?: string; // Links to Firebase Auth UID if registered
  legalName: string;
  spiritualName?: string;
  email: string;
  phone: string;
  role: UserRole;
  mentorId?: string; // Tracks who their mentor is
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: any | null; // Firebase User or auth state instance
  profile: DevoteeProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface EventModel {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  createdBy: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  devoteeId: string;
  devoteeName: string; // Cached for quick rendering lists
  spiritualName?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  markedBy: string;
  timestamp: string;
  notes?: string;
}

export interface HistoryLog {
  id: string;
  action: string; // e.g., "MARK_ATTENDANCE", "UPDATE_PROFILE"
  performedBy: string;
  details: string;
  timestamp: string;
}