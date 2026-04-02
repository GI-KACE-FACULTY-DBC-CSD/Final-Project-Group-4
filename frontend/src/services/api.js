import axios from 'axios';
const API_BASE_URL = '/api';
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Public client for endpoints that should not trigger auth redirects
const apiPublic = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Handle response errors
apiClient.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
// Auth endpoints
export async function loginUser(email, password) {
    try {
        const response = await apiClient.post('/login', { email, password });
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
    }
    catch (error) {
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
export async function logout() {
    await apiClient.post('/logout');
}
export async function forgotPassword(email) {
    const response = await apiPublic.post('/forgot-password', { email });
    return response.data;
}
export async function resetPassword(data) {
    const response = await apiPublic.post('/reset-password', data);
    return response.data;
}
export async function getCurrentUser() {
    const response = await apiClient.get('/user');
    return response.data;
}
export async function updateProfile(data) {
    const response = await apiClient.put('/user', data);
    return response.data.user;
}
// Students endpoints
export async function getStudents(limit, offset) {
    const response = await apiClient.get('/students', {
        params: { limit, offset },
    });
    return response.data;
}
export async function getStudent(id) {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
}
export async function createStudent(data) {
    const response = await apiClient.post('/admin/students', data);
    return response.data.student;
}
export async function updateStudent(id, data) {
    const response = await apiClient.put(`/students/${id}`, data);
    return (response.data.student != null ? response.data.student : response.data);
}
export async function deleteStudent(id) {
    await apiClient.delete(`/students/${id}`);
}
// Lecturers endpoints
export async function getLecturers(limit, offset) {
    const response = await apiClient.get('/lecturers', {
        params: { limit, offset },
    });
    return response.data;
}
export async function getLecturer(id) {
    const response = await apiClient.get(`/lecturers/${id}`);
    return response.data;
}
export async function createLecturer(data) {
    const response = await apiClient.post('/admin/lecturers', data);
    return response.data.lecturer;
}
export async function updateLecturer(id, data) {
    const response = await apiClient.put(`/lecturers/${id}`, data);
    return (response.data.lecturer != null ? response.data.lecturer : response.data);
}
export async function deleteLecturer(id) {
    await apiClient.delete(`/lecturers/${id}`);
}
// Courses endpoints
export async function getCourses() {
    const response = await apiClient.get('/courses');
    return response.data;
}
export async function getCourse(id) {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
}
export async function createCourse(data) {
    const response = await apiClient.post('/courses', data);
    return response.data;
}
export async function updateCourse(id, data) {
    const response = await apiClient.put(`/courses/${id}`, data);
    return response.data;
}
export async function deleteCourse(id) {
    await apiClient.delete(`/courses/${id}`);
}
// Course Modules endpoints
export async function getCourseModules(courseId) {
    const response = await apiClient.get(`/courses/${courseId}/modules`);
    return response.data;
}
export async function createCourseModule(courseId, data) {
    const payload = {
        name: data.name,
        sort_order: data.sort_order || 0,
    };
    const response = await apiClient.post(`/courses/${courseId}/modules`, payload);
    return response.data;
}
export async function updateCourseModule(moduleId, data) {
    const payload = {};
    if (data.name)
        payload.name = data.name;
    if (data.sort_order !== undefined)
        payload.sort_order = data.sort_order;
    const response = await apiClient.put(`/modules/${moduleId}`, payload);
    return response.data;
}
export async function deleteCourseModule(moduleId) {
    await apiClient.delete(`/modules/${moduleId}`);
}
// Sessions endpoints
// Helper function to transform API response (camelCase) to snake_case for frontend
function transformSession(data) {
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
export async function getSessions(limit, offset) {
    const response = await apiClient.get('/sessions', {
        params: { limit, offset },
    });
    return response.data.map(transformSession);
}
// Public sessions list (does not trigger auth redirect on 401)
export async function getPublicSessions(limit, offset) {
    const response = await apiPublic.get('/sessions', {
        params: { limit, offset },
    });
    return response.data.map(transformSession);
}
export async function getSession(id) {
    const response = await apiClient.get(`/sessions/${id}`);
    return transformSession(response.data);
}
export async function createSession(data) {
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
export async function updateSession(id, data) {
    const payload = {};
    if (data.name)
        payload.name = data.name;
    if (data.start_time)
        payload.start_time = data.start_time;
    if (data.end_time)
        payload.end_time = data.end_time;
    if (data.location)
        payload.location = data.location;
    if (data.course_id)
        payload.course_id = data.course_id;
    const response = await apiClient.put(`/sessions/${id}`, payload);
    return transformSession(response.data);
}
export async function deleteSession(id) {
    await apiClient.delete(`/sessions/${id}`);
}
// Attendance endpoints
export async function getAttendance(limit, offset) {
    const response = await apiClient.get('/attendance', {
        params: { limit, offset },
    });
    return response.data;
}
export async function recordAttendance(data) {
    const response = await apiClient.post('/attendance/checkin', data);
    return response.data;
}
export async function recordAttendanceByFace(faceData, studentId) {
    const response = await apiPublic.post('/attendance/checkin-by-face', {
        face_data: faceData,
        student_id: studentId,
    });
    return response.data;
}
// Alerts endpoints
export async function getAlerts() {
    const response = await apiClient.get('/alerts');
    return response.data;
}
export async function markAlertAsRead(id) {
    const response = await apiClient.put(`/alerts/${id}/read`);
    return response.data;
}
export async function getDashboardStats() {
    const response = await apiClient.get('/admin/dashboard-stats');
    return response.data;
}
// Reports endpoints
export async function getAttendanceReport() {
    const response = await apiClient.get('/reports/attendance');
    return response.data;
}
export async function getStudentReport(studentId) {
    const response = await apiClient.get(`/reports/student/${studentId}`);
    return response.data;
}
// User password change
export async function changeUserPassword(currentPassword, newPassword) {
    await apiClient.put('/user/password', {
        current_password: currentPassword,
        new_password: newPassword,
    });
}
// Face-API.js Biometric endpoints for facial recognition with liveness detection
export async function verifyFaceAttendance(biometricHash, confidence, descriptorData) {
    const response = await apiPublic.post('/biometric/verify-attendance', {
        biometric_hash: biometricHash,
        confidence,
        descriptor_data: descriptorData,
    });
    return response.data;
}
export async function getFaceEnrollmentStatus(studentId) {
    const response = await apiPublic.get(`/biometric/status/${studentId}`);
    return response.data;
}
export async function enrollFaceBiometric(studentId, biometricHash, descriptorData, confidence) {
    const response = await apiClient.post('/biometric/enroll', {
        student_id: studentId,
        biometric_hash: biometricHash,
        descriptor_data: descriptorData,
        confidence,
    });
    return response.data;
}
export async function revokeBiometricEnrollment(studentId) {
    const response = await apiClient.delete(`/biometric/enroll/${studentId}`);
    return response.data;
}
//# sourceMappingURL=api.js.map