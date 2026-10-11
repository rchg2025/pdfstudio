export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentName: string;
  studentId: string;
  className: string | null;
  email: string | null;
  deviceHash: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  status: 'PRESENT' | 'LATE' | 'EXCUSED';
  note: string | null;
  checkedInAt: string;
}

export interface AttendanceSession {
  id: string;
  userId: string;
  title: string;
  className: string | null;
  code: string;
  isOpen: boolean;
  requireGps: boolean;
  latitude: number | null;
  longitude: number | null;
  maxDistanceMeters: number | null;
  refreshSeconds: number;
  allowMultiplePerDevice: boolean;
  createdAt: string;
  updatedAt: string;
  records?: AttendanceRecord[];
  _count?: {
    records: number;
  };
}
