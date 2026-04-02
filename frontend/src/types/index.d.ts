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
    plainTextToken?: string;
}
export interface Student {
    id: string;
    user_id: string;
    student_id: string;
    course_id: string;
    year?: number;
    name?: string;
    email?: string;
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
    modules?: CourseModule[];
    created_at: string;
    updated_at: string;
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
    start_time: string;
    end_time: string;
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
    status: 'present' | 'late' | 'absent';
    accuracy?: number;
    biometric_type?: 'fingerprint' | 'facial';
    created_at: string;
    updated_at: string;
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
//# sourceMappingURL=index.d.ts.map