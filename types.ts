
export interface Student {
  id: string; // UUID
  grNumber: string;
  name: string;
  fatherName: string;
  caste: string;
  className: string;
  gender: string;
  religion: string;
  qrCode: string;
  photo?: string; // Base64 string
  sync_status: 'synced' | 'pending' | 'error';
  created_at: number;
}

export interface AttendanceRecord {
  id: string; // UUID
  student_db_id: string; // Foreign key to Student.id
  grNumber: string; // Institutional ID for convenience
  timestamp: number;
  session_name: string;
  status: 'present' | 'absent' | 'leave';
  sync_status: 'synced' | 'pending' | 'error';
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  STUDENTS = 'students',
  SCAN = 'scan',
  REPORTS = 'reports',
  SYNC = 'sync',
  SETTINGS = 'settings'
}

export interface SyncStats {
  pendingStudents: number;
  pendingAttendance: number;
  lastSynced: number | null;
}
