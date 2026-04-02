export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'lecturer' | 'student';
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  plainTextToken?: string; // Some backends return this
}

export interface Student {
  id: string;
  user_id: string;
  student_id: string;
  course_id: string;
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  year?: number;
  name?: string;
  email?: string;
  phone?: string;
  accuracy?: number;
  biometric_template?: string;
  face_image?: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface Lecturer {
  id: string;
  user_id: string;
  lecturer_id: string;
  department: string;
  name?: string;
  email?: string;
   phone?: string;
  courses: string[];
  modules?: string[];
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  /** Optional run segment like 10.1, 11.2 (course run index) */
  runSegment?: string;
  schedule_days?: string[];
  modules?: CourseModule[];
  created_at?: string;
  updated_at?: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: string;
  name: string;
  lecturer_id: string;
  start_time: string; // ISO datetime (e.g., 2026-02-15T09:00:00Z)
  end_time: string; // ISO datetime (e.g., 2026-02-15T11:00:00Z)
  location: string;
  course_id: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  attendance_count: number;
  total_students: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  timestamp: string;
  time_in?: string;
  time_out?: string;
  timeIn?: string;
  timeOut?: string;
  status: 'present' | 'late' | 'absent';
  accuracy?: number;
  biometric_type?: 'fingerprint' | 'facial';
  created_at?: string;
  updated_at?: string;
  /** From API when nested student is returned */
  student_name?: string;
  studentId?: string;
  /** From API when nested session is returned */
  session?: { id: string; name?: string };
}

export interface Alert {
  id: string;
  type: 'late_arrival' | 'low_confidence' | 'absence' | 'system';
  message: string;
  student_id?: string;
  session_id?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Gamification
export interface GamificationMe {
  points_balance: number;
  streaks: {
    current_week_streak: number;
    current_month_streak: number;
    perfect_weeks: number;
    perfect_months: number;
  };
  badges: GamificationBadge[];
  achievements: GamificationBadge[];
  recent_transactions: PointTransaction[];
}

export interface GamificationBadge {
  key: string;
  label: string;
  icon: string;
  earned_at: string;
}

export interface PointTransaction {
  amount: number;
  type: string;
  reference?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  label: string;
  points: number;
}

export interface GamificationLeaderboard {
  period: 'week' | 'month';
  leaderboard: LeaderboardEntry[];
  my_rank: number | null;
}

export interface RedeemablePrivilege {
  id: string;
  name: string;
  description?: string;
  points_cost: number;
}
