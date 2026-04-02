import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { NavigationBlocker } from './components/common/NavigationBlocker';

class SessionPageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Session page error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">The Sessions page could not load. Check the browser console for details.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Public pages
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { AdminForgotPassword } from './pages/admin/AdminForgotPassword';
import { AdminResetPassword } from './pages/admin/AdminResetPassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Debug } from './pages/Debug';
import { StudentCheckIn } from './pages/student/StudentCheckIn';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAlerts } from './pages/admin/AdminAlerts';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminSessions } from './pages/admin/AdminSessions';
import { AdminBiometricEnrollment } from './pages/admin/AdminBiometricEnrollment';

// Lecturer pages
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard';
import { SessionManagement } from './pages/lecturer/SessionManagement';
import { LecturerAttendance } from './pages/lecturer/LecturerAttendance';
import { StudentPerformance } from './pages/lecturer/StudentPerformance';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AttendanceHistory } from './pages/student/AttendanceHistory';
import { StudentSessions } from './pages/student/StudentSessions';
import { StudentAlerts } from './pages/student/StudentAlerts';
import { StudentRewards } from './pages/student/StudentRewards';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationBlocker />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          <Route path="/checkin" element={<StudentCheckIn />} />
          <Route path="/student/checkin" element={<StudentCheckIn />} />
          <Route path="/debug" element={<Debug />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/users" element={<Navigate to="/admin/students" replace />} />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lecturers"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute requiredRole="admin">
                <SessionPageErrorBoundary>
                  <AdminSessions />
                </SessionPageErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollment"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminBiometricEnrollment />
              </ProtectedRoute>
            }
          />
          {/* Documents and Import/Export removed per project request */}

          {/* Lecturer Routes */}
          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute requiredRole="lecturer">
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/sessions"
            element={
              <ProtectedRoute requiredRole="lecturer">
                <SessionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/attendance"
            element={
              <ProtectedRoute requiredRole="lecturer">
                <LecturerAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/performance"
            element={
              <ProtectedRoute requiredRole="lecturer">
                <StudentPerformance />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/history"
            element={
              <ProtectedRoute requiredRole="student">
                <AttendanceHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/sessions"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentSessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/alerts"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/rewards"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentRewards />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
