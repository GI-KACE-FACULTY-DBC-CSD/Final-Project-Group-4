import axios, { AxiosInstance } from 'axios';
import { AuthResponse, User, Student, Lecturer, Course, CourseModule, ClassSession, AttendanceRecord, Alert, GamificationMe, GamificationLeaderboard, RedeemablePrivilege } from '../types';

const API_BASE_URL = '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public client for endpoints that should not trigger auth redirects
const apiPublic: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/login', { email, password });
    const data = response.data;
    
    // Handle both 'token' and 'plainTextToken' field names
    const token = data.token || data.plainTextToken;
    if (!token) {
      throw new Error('No authentication token received from server');
    }
    
    return {
      user: data.user,
      token: token,
      plainTextToken: token,
    };
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error('Login error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    });
    throw error;
  }
}

export async function logout(): Promise<void> {
  await apiClient.post('/logout');
}

export async function forgotPassword(email: string): Promise<{ message: string; token?: string }> {
  const response = await apiPublic.post<{ message: string; token?: string }>('/forgot-password', { email });
  return response.data;
}

export async function resetPassword(data: { email: string; token: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
  const response = await apiPublic.post<{ message: string }>('/reset-password', data);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/user');
  return response.data;
}

export async function updateProfile(data: { name: string; email: string }): Promise<User> {
  const response = await apiClient.put<{ user: User }>('/user', data);
  return response.data.user;
}

// Students endpoints
export async function getStudents(limit?: number, offset?: number): Promise<Student[]> {
  const response = await apiClient.get<Student[]>('/students', {
    params: { limit, offset },
  });
  return response.data;
}

export async function getStudent(id: string): Promise<Student> {
  const response = await apiClient.get<Student>(`/students/${id}`);
  return response.data;
}

/** Create student (admin). Posts to /admin/students. Requires name, email, password, course_id. */
export async function createStudent(data: {
  name: string;
  email: string;
  password: string;
  course_id: string;
  year?: number;
  phone?: string;
  biometric_type?: 'fingerprint' | 'facial';
  biometric_template?: string;
  face_data?: string;
}): Promise<Student> {
  const response = await apiClient.post<{ message: string; student: Student }>('/admin/students', data);
  return response.data.student;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const response = await apiClient.put<{ message?: string; student?: Student }>(`/students/${id}`, data);
  return (response.data.student ?? response.data) as Student;
}

export async function deleteStudent(id: string): Promise<void> {
  await apiClient.delete(`/students/${id}`);
}

// Lecturers endpoints
export async function getLecturers(limit?: number, offset?: number): Promise<Lecturer[]> {
  const response = await apiClient.get<Lecturer[]>('/lecturers', {
    params: { limit, offset },
  });
  return response.data;
}

export async function getLecturer(id: string): Promise<Lecturer> {
  const response = await apiClient.get<Lecturer>(`/lecturers/${id}`);
  return response.data;
}

/** Create lecturer (admin). Posts to /admin/lecturers. */
export async function createLecturer(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department: string;
  courses?: string[];
}): Promise<Lecturer> {
  const response = await apiClient.post<{ message: string; lecturer: Lecturer }>('/admin/lecturers', data);
  return response.data.lecturer;
}

export async function updateLecturer(id: string, data: Partial<Lecturer>): Promise<Lecturer> {
  const response = await apiClient.put<{ message?: string; lecturer?: Lecturer }>(`/lecturers/${id}`, data);
  return (response.data.lecturer ?? response.data) as Lecturer;
}

export async function deleteLecturer(id: string): Promise<void> {
  await apiClient.delete(`/lecturers/${id}`);
}

// Courses endpoints
export async function getCourses(): Promise<Course[]> {
  const response = await apiClient.get<Course[]>('/courses');
  return response.data;
}

export async function getCourse(id: string): Promise<Course> {
  const response = await apiClient.get<Course>(`/courses/${id}`);
  return response.data;
}

export async function createCourse(data: Partial<Course>): Promise<Course> {
  const response = await apiClient.post<Course>('/courses', data);
  return response.data;
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<Course> {
  const response = await apiClient.put<Course>(`/courses/${id}`, data);
  return response.data;
}

export async function deleteCourse(id: string): Promise<void> {
  await apiClient.delete(`/courses/${id}`);
}

// Course Modules endpoints
export async function getCourseModules(courseId: string): Promise<CourseModule[]> {
  const response = await apiClient.get<CourseModule[]>(`/courses/${courseId}/modules`);
  return response.data;
}

export async function createCourseModule(courseId: string, data: Partial<CourseModule>): Promise<CourseModule> {
  const payload = {
    name: data.name,
    sort_order: data.sort_order || 0,
  };
  const response = await apiClient.post<CourseModule>(`/courses/${courseId}/modules`, payload);
  return response.data;
}

export async function updateCourseModule(moduleId: string, data: Partial<CourseModule>): Promise<CourseModule> {
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.sort_order !== undefined) payload.sort_order = data.sort_order;
  
  const response = await apiClient.put<CourseModule>(`/modules/${moduleId}`, payload);
  return response.data;
}

export async function deleteCourseModule(moduleId: string): Promise<void> {
  await apiClient.delete(`/modules/${moduleId}`);
}

// Sessions endpoints
// Helper function to transform API response (camelCase) to snake_case for frontend
function transformSession(data: any): ClassSession {
  return {
    id: data.id,
    name: data.name,
    lecturer_id: data.lecturerId || data.lecturer_id,
    start_time: data.startTime || data.start_time,
    end_time: data.endTime || data.end_time,
    location: data.location,
    course_id: data.courseId || data.course_id,
    status: data.status,
    attendance_count: data.attendanceCount || data.attendance_count,
    total_students: data.totalStudents || data.total_students,
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
  };
}

export async function getSessions(limit?: number, offset?: number): Promise<ClassSession[]> {
  const response = await apiClient.get('/sessions', {
    params: { limit, offset },
  });
  const raw = response?.data;
  const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
  return list.map((item: any) => transformSession(item));
}

// Public sessions list for check-in kiosk (no auth required)
export async function getPublicSessions(limit?: number, offset?: number): Promise<ClassSession[]> {
  const response = await apiPublic.get('/sessions/public', {
    params: { limit, offset },
  });
  const raw = response?.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((item: any) => transformSession(item));
}

export async function getSession(id: string): Promise<ClassSession> {
  const response = await apiClient.get(`/sessions/${id}`);
  return transformSession(response.data);
}

export async function createSession(data: Partial<ClassSession>): Promise<ClassSession> {
  const payload = {
    name: data.name,
    lecturer_id: data.lecturer_id,
    start_time: data.start_time,
    end_time: data.end_time,
    location: data.location,
    course_id: data.course_id,
  };
  const response = await apiClient.post('/sessions', payload);
  return transformSession(response.data);
}

export async function updateSession(id: string, data: Partial<ClassSession>): Promise<ClassSession> {
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.start_time) payload.start_time = data.start_time;
  if (data.end_time) payload.end_time = data.end_time;
  if (data.location) payload.location = data.location;
  if (data.course_id) payload.course_id = data.course_id;
  
  const response = await apiClient.put(`/sessions/${id}`, payload);
  return transformSession(response.data);
}

export async function deleteSession(id: string): Promise<void> {
  await apiClient.delete(`/sessions/${id}`);
}

// Normalize attendance record from API (camelCase + nested student/session); clamp accuracy 0-100
function transformAttendanceRecord(raw: any): AttendanceRecord {
  const timeIn = raw.timeIn ?? raw.time_in;
  const timeOut = raw.timeOut ?? raw.time_out;
  const studentId = raw.student_id ?? raw.student?.id;
  const sessionId = raw.session_id ?? raw.session?.id;
  let accuracy = raw.accuracy;
  if (accuracy != null) {
    const n = Number(accuracy);
    accuracy = Math.min(100, Math.max(0, n > 1 ? n : n * 100));
  }
  return {
    id: raw.id,
    student_id: studentId ?? '',
    session_id: sessionId ?? '',
    timestamp: raw.timestamp ?? raw.created_at ?? '',
    time_in: timeIn,
    time_out: timeOut ?? undefined,
    timeIn: timeIn,
    timeOut: timeOut ?? undefined,
    status: raw.status ?? 'present',
    accuracy,
    biometric_type: raw.biometricType ?? raw.biometric_type,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    student_name: raw.student?.name ?? raw.student_name,
    studentId: raw.student?.studentId ?? raw.student_id,
    session: raw.session ? { id: raw.session.id ?? sessionId, name: raw.session.name } : undefined,
  };
}

// Attendance endpoints
export async function getAttendance(limit?: number, offset?: number, sessionId?: string): Promise<AttendanceRecord[]> {
  const params: Record<string, number | string | undefined> = { limit, offset };
  if (sessionId) params.session_id = sessionId;
  const response = await apiClient.get<any[]>('/attendance', { params });
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(transformAttendanceRecord);
}

export async function recordAttendance(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
  const response = await apiClient.post<AttendanceRecord>('/attendance/checkin', data);
  return response.data;
}

export async function recordAttendanceByFace(faceData: string, studentId?: string): Promise<AttendanceRecord> {
  const response = await apiPublic.post<AttendanceRecord>('/attendance/checkin-by-face', {
    face_data: faceData,
    student_id: studentId,
  });
  return response.data;
}

// Alerts endpoints
export async function getAlerts(): Promise<Alert[]> {
  const response = await apiClient.get<Alert[]>('/alerts');
  return response.data;
}

export async function markAlertAsRead(id: string): Promise<Alert> {
  const response = await apiClient.put<Alert>(`/alerts/${id}/read`);
  return response.data;
}

// Gamification (student rewards, streaks, leaderboard, redeem)
export async function getGamificationMe(): Promise<GamificationMe> {
  const response = await apiClient.get<GamificationMe>('/gamification/me');
  return response.data;
}

export async function getGamificationLeaderboard(period: 'week' | 'month' = 'week'): Promise<GamificationLeaderboard> {
  const response = await apiClient.get<GamificationLeaderboard>('/gamification/leaderboard', { params: { period } });
  return response.data;
}

export async function getGamificationPrivileges(): Promise<RedeemablePrivilege[]> {
  const response = await apiClient.get<RedeemablePrivilege[]>('/gamification/privileges');
  return response.data;
}

export async function redeemPrivilege(privilegeId: string): Promise<{ message: string; new_balance: number; privilege?: { id: string; name: string; points_spent: number } }> {
  const response = await apiClient.post('/gamification/redeem', { privilege_id: privilegeId });
  return response.data;
}

// Dashboard (lightweight stats – one fast request)
export interface DashboardStats {
  stats: {
    students: number;
    lecturers: number;
    sessions: number;
    alerts: number;
    totalAttendance: number;
    attendanceRate: number;
    ongoingSessions: number;
  };
  attendanceTrend: Array<{ date: string; present: number; late: number; absent: number; total: number }>;
  recentAlerts: Alert[];
}
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>('/admin/dashboard-stats');
  return response.data;
}

// Reports endpoints
export async function getAttendanceReport(): Promise<any> {
  const response = await apiClient.get('/reports/summary');
  return response.data;
}

export async function getStudentReport(studentId: string): Promise<any> {
  const response = await apiClient.get(`/reports/student/${studentId}`);
  return response.data;
}

// User password change (authenticated user)
export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/user/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

// Face-API.js Biometric endpoints for facial recognition with liveness detection
export async function verifyFaceAttendance(
  biometricHash: string,
  confidence: number,
  descriptorData: string
): Promise<any> {
  const response = await apiPublic.post('/biometric/verify-attendance', {
    biometric_hash: biometricHash,
    confidence,
    descriptor_data: descriptorData,
  });
  return response.data;
}

export async function verifyFaceCheckout(
  biometricHash: string,
  confidence: number,
  descriptorData: string
): Promise<any> {
  const response = await apiPublic.post('/biometric/checkout', {
    biometric_hash: biometricHash,
    confidence,
    descriptor_data: descriptorData,
  });
  return response.data;
}

export async function getFaceEnrollmentStatus(studentId: string): Promise<any> {
  const response = await apiPublic.get(`/biometric/status/${studentId}`);
  return response.data;
}

export async function enrollFaceBiometric(
  studentId: string,
  biometricHash: string,
  descriptorData: string,
  confidence: number
): Promise<any> {
  const response = await apiClient.post('/biometric/enroll', {
    student_id: studentId,
    biometric_hash: biometricHash,
    descriptor_data: descriptorData,
    confidence,
  });
  return response.data;
}

export async function revokeBiometricEnrollment(studentId: string): Promise<any> {
  const response = await apiClient.delete(`/biometric/enroll/${studentId}`);
  return response.data;
}

